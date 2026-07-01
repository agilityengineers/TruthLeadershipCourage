import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, shipmentStatusEnum } from "./_shared";
import { enrollment } from "./enrollment";

export const shipment = pgTable("shipment", {
  id: idPk("ship"),
  enrollmentId: text("enrollment_id")
    .notNull()
    .references(() => enrollment.id)
    .unique(),
  status: shipmentStatusEnum("status").notNull().default("PENDING"),
  carrier: text("carrier"),
  tracking: text("tracking"),
  address: jsonb("address"),
  shippedAt: timestamp("shipped_at", { withTimezone: true, mode: "date" }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const shipmentRelations = relations(shipment, ({ one }) => ({
  enrollment: one(enrollment, { fields: [shipment.enrollmentId], references: [enrollment.id] }),
}));

export const insertShipmentSchema = createInsertSchema(shipment);
export const selectShipmentSchema = createSelectSchema(shipment);
export type Shipment = typeof shipment.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
