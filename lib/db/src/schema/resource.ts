import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, resourceTypeEnum, resourceStatusEnum } from "./_shared";
import { program } from "./program";
import { cohort } from "./cohort";
import { module } from "./module";
import { user } from "./user";

export const resource = pgTable("resource", {
  id: idPk("res"),
  programId: text("program_id").references(() => program.id),
  cohortId: text("cohort_id").references(() => cohort.id),
  moduleId: text("module_id").references(() => module.id),
  uploadedById: text("uploaded_by_id").references(() => user.id),
  title: text("title").notNull(),
  type: resourceTypeEnum("type").notNull(),
  status: resourceStatusEnum("status").notNull().default("DRAFT"),
  fileKey: text("file_key"),
  url: text("url"),
  description: text("description"),
  printReady: boolean("print_ready").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const resourceRelations = relations(resource, ({ one }) => ({
  program: one(program, { fields: [resource.programId], references: [program.id] }),
  cohort: one(cohort, { fields: [resource.cohortId], references: [cohort.id] }),
  module: one(module, { fields: [resource.moduleId], references: [module.id] }),
  uploadedBy: one(user, { fields: [resource.uploadedById], references: [user.id] }),
}));

export const insertResourceSchema = createInsertSchema(resource);
export const selectResourceSchema = createSelectSchema(resource);
export type Resource = typeof resource.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
