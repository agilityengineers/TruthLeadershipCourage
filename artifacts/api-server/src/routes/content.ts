import { Router, type IRouter } from "express";
import express from "express";
import { randomUUID } from "node:crypto";
import {
  SECTIONS,
  SECTION_BY_KEY,
  schemaFor,
  resolveContent,
  type SectionDef,
} from "@workspace/site-content";
import { db, schema, eq, asc } from "../lib/db";
import { asyncHandler, HttpError, badRequest, notFound } from "../lib/http";
import { requireCapability } from "../lib/principal";
import { audit } from "../lib/services";
import { isBlobConfigured, putObject } from "../lib/blob";

const router: IRouter = Router();

type Row = typeof schema.siteSection.$inferSelect;

async function allRows(): Promise<Row[]> {
  return db.query.siteSection.findMany();
}

/** Ensure a DB row exists for a key (lazily materialize from the registry default). */
async function ensureRow(def: SectionDef): Promise<Row> {
  const existing = await db.query.siteSection.findFirst({
    where: eq(schema.siteSection.key, def.key),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(schema.siteSection)
    .values({
      id: `sec_${def.key.replace(/[^a-zA-Z0-9]/g, "_")}`,
      key: def.key,
      page: def.page,
      label: def.label,
      order: def.order,
      visible: true,
      content: def.default,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  // Conflict race: fetch the now-existing row.
  return (await db.query.siteSection.findFirst({ where: eq(schema.siteSection.key, def.key) }))!;
}

function getDef(key: string): SectionDef {
  const def = SECTION_BY_KEY[key];
  if (!def) throw notFound(`Unknown section: ${key}`);
  return def;
}

// ─────────────────────────────── Public read ────────────────────────────────

/**
 * Public: visible sections for a page plus all global sections (nav/footer),
 * each resolved (stored content merged over the registry default). The SPA
 * renders page sections in order and picks global.nav / global.footer by key.
 */
router.get(
  "/content/page/:page",
  asyncHandler(async (req, res) => {
    const page = String(req.params.page);
    const rows = await allRows();
    const byKey = new Map(rows.map((r) => [r.key, r]));

    const wanted = SECTIONS.filter(
      (d) => d.page === "global" || d.page === page,
    );
    const sections = wanted
      .map((d) => {
        const row = byKey.get(d.key);
        const visible = row ? row.visible : true;
        return {
          key: d.key,
          page: d.page,
          order: row ? row.order : d.order,
          visible,
          content: resolveContent(d, row?.content),
        };
      })
      // Global sections always render; page sections only when visible.
      .filter((s) => s.page === "global" || s.visible)
      .sort((a, b) => a.order - b.order);

    res.json({ sections });
  }),
);

// ─────────────────────────────── Admin read ─────────────────────────────────

/** Admin: every section resolved, with field descriptors for the editor. */
router.get(
  "/admin/content",
  asyncHandler(async (req, res) => {
    await requireCapability(req, "content:manage");
    const rows = await allRows();
    const byKey = new Map(rows.map((r) => [r.key, r]));

    const sections = SECTIONS.map((d) => {
      const row = byKey.get(d.key);
      return {
        key: d.key,
        page: d.page,
        group: d.group,
        label: d.label,
        description: d.description,
        core: d.core ?? false,
        order: row ? row.order : d.order,
        visible: row ? row.visible : true,
        fields: d.fields,
        content: resolveContent(d, row?.content),
      };
    });

    res.json({ sections, uploadEnabled: isBlobConfigured() });
  }),
);

// ─────────────────────────────── Admin writes ───────────────────────────────

/** Update a section's content (validated against its registry schema). */
router.post(
  "/admin/content/sections/:key",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "content:manage");
    const def = getDef(String(req.params.key));
    const content = (req.body as { content?: unknown })?.content;
    const parsed = schemaFor(def).safeParse(content);
    if (!parsed.success) {
      throw badRequest(parsed.error.issues[0]?.message ?? "Invalid content.");
    }
    await ensureRow(def);
    await db
      .update(schema.siteSection)
      .set({ content: parsed.data as object, updatedBy: principal.id })
      .where(eq(schema.siteSection.key, def.key));
    await audit({ actorId: principal.id, action: "section.update", entity: "SiteSection", entityId: def.key });
    res.json({ ok: true });
  }),
);

/** Toggle a section's visibility. */
router.post(
  "/admin/content/sections/:key/visibility",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "content:manage");
    const def = getDef(String(req.params.key));
    const visible = (req.body as { visible?: unknown })?.visible;
    if (typeof visible !== "boolean") throw badRequest("`visible` must be a boolean.");
    await ensureRow(def);
    await db
      .update(schema.siteSection)
      .set({ visible, updatedBy: principal.id })
      .where(eq(schema.siteSection.key, def.key));
    await audit({
      actorId: principal.id,
      action: visible ? "section.show" : "section.hide",
      entity: "SiteSection",
      entityId: def.key,
    });
    res.json({ ok: true });
  }),
);

/** Move a section up or down within its page (swaps order with its neighbor). */
router.post(
  "/admin/content/sections/:key/reorder",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "content:manage");
    const def = getDef(String(req.params.key));
    const direction = (req.body as { direction?: unknown })?.direction;
    if (direction !== "up" && direction !== "down") {
      throw badRequest("`direction` must be 'up' or 'down'.");
    }
    await ensureRow(def);
    // Materialize all rows on this page for stable ordering.
    for (const d of SECTIONS.filter((x) => x.page === def.page)) await ensureRow(d);
    const peers = await db.query.siteSection.findMany({
      where: eq(schema.siteSection.page, def.page),
      orderBy: [asc(schema.siteSection.order)],
    });
    const idx = peers.findIndex((p) => p.key === def.key);
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (idx >= 0 && swap >= 0 && swap < peers.length) {
      const a = peers[idx]!;
      const b = peers[swap]!;
      await db.transaction(async (tx) => {
        await tx.update(schema.siteSection).set({ order: b.order }).where(eq(schema.siteSection.id, a.id));
        await tx.update(schema.siteSection).set({ order: a.order }).where(eq(schema.siteSection.id, b.id));
      });
      await audit({ actorId: principal.id, action: "section.reorder", entity: "SiteSection", entityId: def.key });
    }
    res.json({ ok: true });
  }),
);

/** Reset a section's content to the registry default. */
router.post(
  "/admin/content/sections/:key/reset",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "content:manage");
    const def = getDef(String(req.params.key));
    await ensureRow(def);
    await db
      .update(schema.siteSection)
      .set({ content: def.default, updatedBy: principal.id })
      .where(eq(schema.siteSection.key, def.key));
    await audit({ actorId: principal.id, action: "section.reset", entity: "SiteSection", entityId: def.key });
    res.json({ ok: true });
  }),
);

// ─────────────────────────────── Image upload ───────────────────────────────

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024;

/** Authenticated image upload (base64 JSON) to the configured S3 bucket. */
router.post(
  "/admin/content/upload",
  express.json({ limit: "8mb" }),
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "content:manage");
    if (!isBlobConfigured()) {
      throw new HttpError(503, "Image storage isn't configured yet. Paste an image URL instead, or set S3_* env.");
    }
    const { contentType, dataBase64 } = (req.body ?? {}) as { contentType?: string; dataBase64?: string };
    const ext = contentType ? ALLOWED[contentType] : undefined;
    if (!ext) throw badRequest("Unsupported image type. Use PNG, JPG, WebP, GIF, AVIF, or SVG.");
    if (!dataBase64 || typeof dataBase64 !== "string") throw badRequest("Missing image data.");

    const buffer = Buffer.from(dataBase64, "base64");
    if (buffer.length === 0) throw badRequest("Empty image.");
    if (buffer.length > MAX_BYTES) throw new HttpError(413, "Image is too large (max 5 MB).");

    const key = `site-content/${randomUUID()}.${ext}`;
    const url = await putObject(key, buffer, contentType!);
    await audit({ actorId: principal.id, action: "image.upload", entity: "SiteSection", meta: { key } });
    res.json({ url });
  }),
);

export default router;
