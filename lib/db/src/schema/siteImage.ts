import { pgTable, text, customType } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";

/** Postgres `bytea` — drizzle-orm has no built-in; node-postgres round-trips Buffer. */
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Admin-uploaded site image (hero photos, section icons…), stored in Postgres
 * so uploads work — and survive redeploys — without any external object
 * storage. Served publicly at `/api/content/images/:id`. When S3_* env is
 * configured the upload route stores to the bucket instead of here.
 */
export const siteImage = pgTable("site_image", {
  id: idPk("img"),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
  uploadedBy: text("uploaded_by"),
  createdAt: createdAt(),
});

export const insertSiteImageSchema = createInsertSchema(siteImage);
export const selectSiteImageSchema = createSelectSchema(siteImage);
export type SiteImage = typeof siteImage.$inferSelect;
export type InsertSiteImage = z.infer<typeof insertSiteImageSchema>;
