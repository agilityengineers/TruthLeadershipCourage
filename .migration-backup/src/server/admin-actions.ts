"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { audit } from "@/lib/audit";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Clone a cohort: copies config + weekly/coaching events (date-shifted) into a
 * new cohort. This is how admins launch "the next cohort" — never a code change.
 */
export async function cloneCohort(input: { sourceId: string; name: string; startDate: string }) {
  const principal = await requireCapability("cohort:manage");
  const { sourceId, name, startDate } = z
    .object({ sourceId: z.string(), name: z.string().min(1), startDate: z.string() })
    .parse(input);

  const source = await db.cohort.findUnique({
    where: { id: sourceId },
    include: { events: true },
  });
  if (!source) throw new Error("Source cohort not found");

  const newStart = new Date(startDate);
  const shiftMs = newStart.getTime() - new Date(source.startDate).getTime();
  const newEnd = new Date(new Date(source.endDate).getTime() + shiftMs);

  let slug = slugify(name);
  if (await db.cohort.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;

  const clone = await db.cohort.create({
    data: {
      programId: source.programId,
      name,
      slug,
      startDate: newStart,
      endDate: newEnd,
      sessionDay: source.sessionDay,
      sessionTime: source.sessionTime,
      timezone: source.timezone,
      price: source.price,
      currency: source.currency,
      capacity: source.capacity,
      status: "ENROLLING",
      isPrivate: source.isPrivate,
      companyId: source.companyId,
      trainerId: source.trainerId,
      events: {
        create: source.events.map((e) => ({
          moduleId: e.moduleId,
          type: e.type,
          title: e.title,
          startAt: new Date(e.startAt.getTime() + shiftMs),
          endAt: new Date(e.endAt.getTime() + shiftMs),
          joinUrl: e.joinUrl,
          weekNo: e.weekNo,
        })),
      },
    },
  });

  await audit({ actorId: principal.id, action: "cohort.clone", entity: "Cohort", entityId: clone.id, meta: { sourceId } });
  revalidatePath("/admin/cohorts");
  return { ok: true as const, id: clone.id };
}

export async function createCompany(input: { name: string; billingEmail?: string }) {
  const principal = await requireCapability("company:manage");
  const { name, billingEmail } = z
    .object({ name: z.string().min(1), billingEmail: z.string().email().optional().or(z.literal("")) })
    .parse(input);
  let slug = slugify(name);
  if (await db.company.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const company = await db.company.create({
    data: { name, slug, billingEmail: billingEmail || null },
  });
  await audit({ actorId: principal.id, action: "company.create", entity: "Company", entityId: company.id });
  revalidatePath("/admin/companies");
  return { ok: true as const, id: company.id };
}

/** Buy a block of seats for a company (corporate/bulk purchase). */
export async function purchaseSeats(input: { companyId: string; cohortId: string; quantity: number }) {
  const principal = await requireCapability("company:manage");
  const { companyId, cohortId, quantity } = z
    .object({ companyId: z.string(), cohortId: z.string(), quantity: z.number().min(1).max(500) })
    .parse(input);
  await db.seat.createMany({
    data: Array.from({ length: quantity }, () => ({
      cohortId,
      companyId,
      status: "AVAILABLE" as const,
      purchasedById: principal.id,
    })),
  });
  await audit({
    actorId: principal.id,
    action: "seats.purchase",
    entity: "Company",
    entityId: companyId,
    meta: { cohortId, quantity },
  });
  revalidatePath("/admin/companies");
  return { ok: true as const };
}
