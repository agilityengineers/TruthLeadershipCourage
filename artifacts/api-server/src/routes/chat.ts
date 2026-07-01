import { Router, type IRouter } from "express";
import { SendMessageBody } from "@workspace/api-zod";
import { db, schema, eq, and, ne, gt, asc, desc, count } from "../lib/db";
import { asyncHandler, forbidden } from "../lib/http";
import { requirePrincipal } from "../lib/principal";
import { notifyMany } from "../lib/services";

const router: IRouter = Router();
const userCols = { id: true, name: true, email: true, image: true, title: true } as const;

/** Threads the user belongs to, newest activity first. */
router.get(
  "/chat/threads",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const memberships = await db.query.threadMember.findMany({
      where: eq(schema.threadMember.userId, p.id),
      with: {
        thread: {
          with: {
            cohort: { columns: { id: true, name: true } },
            members: { with: { user: { columns: userCols } } },
            messages: { orderBy: [desc(schema.message.createdAt)], limit: 1, with: { sender: { columns: userCols } } },
          },
        },
      },
    });
    const threads = memberships
      .filter((m) => m.thread)
      .map((m) => {
        const t = m.thread;
        const others = t.members.filter((mm) => mm.userId !== p.id).map((mm) => mm.user);
        const title =
          t.type === "COHORT_CHANNEL"
            ? t.title ?? `${t.cohort?.name ?? "Cohort"} channel`
            : others.map((u) => u?.name).filter(Boolean).join(", ") || "Direct message";
        const last = t.messages[0];
        return {
          id: t.id,
          type: t.type,
          title,
          lastMessage: last ? { body: last.body, at: last.createdAt, sender: last.sender?.name ?? null } : null,
          lastReadAt: m.lastReadAt,
        };
      });
    threads.sort((a, b) => {
      const at = a.lastMessage ? new Date(a.lastMessage.at).getTime() : 0;
      const bt = b.lastMessage ? new Date(b.lastMessage.at).getTime() : 0;
      return bt - at;
    });
    res.json(threads);
  }),
);

/** Unread messages across the user's threads (for nav badges). */
router.get(
  "/chat/unread-count",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const members = await db.query.threadMember.findMany({
      where: eq(schema.threadMember.userId, p.id),
      columns: { threadId: true, lastReadAt: true },
    });
    let total = 0;
    for (const m of members) {
      const [{ n } = { n: 0 }] = await db
        .select({ n: count() })
        .from(schema.message)
        .where(
          and(
            eq(schema.message.threadId, m.threadId),
            ne(schema.message.senderId, p.id),
            ...(m.lastReadAt ? [gt(schema.message.createdAt, m.lastReadAt)] : []),
          ),
        );
      total += Number(n);
    }
    res.json({ count: total });
  }),
);

/** Full thread with messages, asserting membership (oversight bypasses). */
router.get(
  "/chat/threads/:id",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const id = String(req.params.id);
    const oversight = req.query.oversight === "true" || req.query.oversight === "1";
    const member = await db.query.threadMember.findFirst({
      where: and(eq(schema.threadMember.threadId, id), eq(schema.threadMember.userId, p.id)),
    });
    const staff = oversight && ["ADMIN", "SUPER_ADMIN", "TRAINER"].includes(p.role);
    if (!member && !staff) {
      res.json(null);
      return;
    }
    const thread = await db.query.thread.findFirst({
      where: eq(schema.thread.id, id),
      with: {
        cohort: { columns: { id: true, name: true } },
        members: { with: { user: { columns: userCols } } },
        messages: { orderBy: [asc(schema.message.createdAt)], with: { sender: { columns: userCols } } },
      },
    });
    if (!thread) {
      res.json(null);
      return;
    }
    res.json({
      id: thread.id,
      type: thread.type,
      title: thread.title,
      cohort: thread.cohort ?? null,
      members: thread.members.map((m) => ({ userId: m.userId, user: m.user })),
      messages: thread.messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        senderName: m.sender?.name ?? null,
        createdAt: m.createdAt,
      })),
    });
  }),
);

/** Post a message to a thread the user is a member of. */
router.post(
  "/chat/threads/:id/messages",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const threadId = String(req.params.id);
    const { body } = SendMessageBody.parse(req.body);
    if (!body.trim()) {
      res.json({ ok: false, error: "Message is empty" });
      return;
    }
    const member = await db.query.threadMember.findFirst({
      where: and(eq(schema.threadMember.threadId, threadId), eq(schema.threadMember.userId, p.id)),
    });
    const isStaff = ["ADMIN", "SUPER_ADMIN"].includes(p.role);
    if (!member && !isStaff) {
      res.json({ ok: false, error: "Not a member of this thread" });
      return;
    }
    const [message] = await db
      .insert(schema.message)
      .values({ threadId, senderId: p.id, body })
      .returning();
    await db.update(schema.thread).set({ updatedAt: new Date() }).where(eq(schema.thread.id, threadId));

    const others = await db.query.threadMember.findMany({
      where: and(eq(schema.threadMember.threadId, threadId), ne(schema.threadMember.userId, p.id)),
      columns: { userId: true },
    });
    await notifyMany(
      others.map((o) => o.userId),
      { type: "NEW_MESSAGE", title: "New message", body: body.slice(0, 80), href: "/portal/messages" },
    );
    res.json({ ok: true, id: message!.id });
  }),
);

/** Mark a thread read up to now for the current user. */
router.post(
  "/chat/threads/:id/read",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    await db
      .update(schema.threadMember)
      .set({ lastReadAt: new Date() })
      .where(and(eq(schema.threadMember.threadId, String(req.params.id)), eq(schema.threadMember.userId, p.id)));
    res.json({ ok: true });
  }),
);

export default router;
export { forbidden };
