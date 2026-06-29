"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { audit } from "@/lib/audit";
import { issueCertificate } from "@/lib/certificate";
import type { Principal } from "@/lib/scope";
import type { EventType, ResourceStatus, ResourceType } from "@prisma/client";

/** Trainers/admins only. Returns the principal or throws. */
async function requireTrainer(): Promise<Principal> {
  const principal = await requirePrincipal();
  if (
    principal.role !== "TRAINER" &&
    principal.role !== "ADMIN" &&
    principal.role !== "SUPER_ADMIN"
  ) {
    throw new Error("Forbidden");
  }
  return principal;
}

/** Verify the acting trainer owns the cohort (admins bypass). Throws otherwise. */
async function assertOwnsCohort(principal: Principal, cohortId: string) {
  if (principal.role === "ADMIN" || principal.role === "SUPER_ADMIN") return;
  const cohort = await db.cohort.findUnique({
    where: { id: cohortId },
    select: { trainerId: true },
  });
  if (!cohort) throw new Error("Cohort not found");
  if (cohort.trainerId !== principal.id) throw new Error("Forbidden: not your cohort");
}

export type CreateResourceInput = {
  cohortId: string;
  title: string;
  type: ResourceType;
  moduleId?: string | null;
  fileKey?: string | null;
  printReady?: boolean;
  description?: string | null;
};

/** Create a cohort resource. New resources default to DRAFT. */
export async function createResource(input: CreateResourceInput) {
  const principal = await requireTrainer();
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  await assertOwnsCohort(principal, input.cohortId);

  const resource = await db.resource.create({
    data: {
      cohortId: input.cohortId,
      title,
      type: input.type,
      moduleId: input.moduleId || null,
      fileKey: input.fileKey?.trim() || null,
      description: input.description?.trim() || null,
      printReady: input.printReady ?? false,
      status: "DRAFT",
      uploadedById: principal.id,
    },
  });

  await audit({
    actorId: principal.id,
    action: "resource.create",
    entity: "Resource",
    entityId: resource.id,
    meta: { cohortId: input.cohortId, type: input.type, title },
  });

  revalidatePath("/trainer/resources");
  revalidatePath("/trainer");
  return { ok: true, id: resource.id };
}

/** Publish / unpublish a resource. */
export async function setResourceStatus(resourceId: string, status: ResourceStatus) {
  const principal = await requireTrainer();
  const resource = await db.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, cohortId: true },
  });
  if (!resource?.cohortId) throw new Error("Resource not found");
  await assertOwnsCohort(principal, resource.cohortId);

  await db.resource.update({ where: { id: resourceId }, data: { status } });

  await audit({
    actorId: principal.id,
    action: "resource.setStatus",
    entity: "Resource",
    entityId: resourceId,
    meta: { status },
  });

  revalidatePath("/trainer/resources");
  revalidatePath("/trainer");
  return { ok: true };
}

export type CreateEventInput = {
  cohortId: string;
  type: EventType;
  title: string;
  startAt: string; // ISO from <input type="datetime-local">
  endAt: string;
  joinUrl?: string | null;
  location?: string | null;
  weekNo?: number | null;
  moduleId?: string | null;
};

/** Create a cohort event (weekly session or 1:1 coaching). */
export async function createEvent(input: CreateEventInput) {
  const principal = await requireTrainer();
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Valid start and end times are required");
  }
  if (endAt < startAt) throw new Error("End time must be after start time");
  await assertOwnsCohort(principal, input.cohortId);

  const event = await db.event.create({
    data: {
      cohortId: input.cohortId,
      type: input.type,
      title,
      startAt,
      endAt,
      joinUrl: input.joinUrl?.trim() || null,
      location: input.location?.trim() || null,
      weekNo: input.weekNo ?? null,
      moduleId: input.moduleId || null,
    },
  });

  await audit({
    actorId: principal.id,
    action: "event.create",
    entity: "Event",
    entityId: event.id,
    meta: { cohortId: input.cohortId, type: input.type, title },
  });

  revalidatePath("/trainer/events");
  revalidatePath("/trainer");
  return { ok: true, id: event.id };
}

/**
 * Issue a completion certificate for an enrollment that has finished all weeks.
 * Trainer (own cohort) / admin only. Idempotent — returns the existing serial if
 * already issued.
 */
export async function issueCertificateForEnrollment(enrollmentId: string) {
  const principal = await requireTrainer();
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, cohortId: true, status: true, certificate: { select: { id: true } } },
  });
  if (!enrollment) return { ok: false as const, error: "Enrollment not found" };
  await assertOwnsCohort(principal, enrollment.cohortId);
  if (enrollment.status !== "COMPLETED") {
    return { ok: false as const, error: "Participant has not completed all weeks yet." };
  }

  const cert = await issueCertificate(enrollmentId);

  await audit({
    actorId: principal.id,
    action: "certificate.issue",
    entity: "Certificate",
    entityId: cert.id,
    meta: { enrollmentId },
  });

  revalidatePath(`/trainer/participants/${enrollmentId}`);
  revalidatePath("/portal/certificate");
  return { ok: true as const, serial: cert.serial };
}
