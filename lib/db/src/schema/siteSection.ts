import { pgTable, text, integer, boolean, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt } from "./_shared";

/**
 * Admin-editable public marketing section (hero, FAQ, testimonials, footer…).
 * `content` is a per-section JSON payload validated against a Zod schema in
 * `@workspace/site-content`; `visible` is the on/off toggle; `order` sets the
 * position within a page. Defaults live in the registry so a fresh install
 * renders identically before any edit.
 */
export const siteSection = pgTable(
  "site_section",
  {
    id: idPk("sec"),
    key: text("key").notNull(), // stable id, e.g. "home.hero"
    page: text("page").notNull(), // "home" | "organizations" | "global" | …
    label: text("label").notNull(),
    order: integer("order").notNull(),
    visible: boolean("visible").notNull().default(true),
    content: jsonb("content").notNull(),
    updatedBy: text("updated_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("site_section_key_uq").on(t.key), index("site_section_page_idx").on(t.page)],
);

export const insertSiteSectionSchema = createInsertSchema(siteSection);
export const selectSiteSectionSchema = createSelectSchema(siteSection);
export type SiteSection = typeof siteSection.$inferSelect;
export type InsertSiteSection = z.infer<typeof insertSiteSectionSchema>;
