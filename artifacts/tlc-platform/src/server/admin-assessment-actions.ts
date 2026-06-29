import { z } from "zod";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { audit } from "@/lib/audit";
import { PILLAR_COLOR } from "@/lib/utils";
import type { Pillar } from "@/data/types";

const pillarEnum = z.enum(["EQ", "IQ", "MQ"]);

async function getAssessmentId() {
  const a = await db.assessment.findFirst({ where: { program: { slug: "tlc" } } });
  if (!a) throw new Error("Assessment not configured");
  return a.id;
}

/** Add a question to the live assessment. */
export async function addQuestion(input: {
  theme: string;
  pillar: Pillar;
  prompt: string;
  benefit: string;
}) {
  const principal = await requireCapability("assessment:manage");
  const parsed = z
    .object({ theme: z.string().min(1), pillar: pillarEnum, prompt: z.string().min(1), benefit: z.string().min(1) })
    .parse(input);
  const assessmentId = await getAssessmentId();
  const max = await db.question.aggregate({ where: { assessmentId }, _max: { order: true } });
  const q = await db.question.create({
    data: {
      assessmentId,
      order: (max._max.order ?? 0) + 1,
      theme: parsed.theme,
      pillar: parsed.pillar,
      color: PILLAR_COLOR[parsed.pillar],
      prompt: parsed.prompt,
      benefit: parsed.benefit,
    },
  });
  await audit({ actorId: principal.id, action: "question.add", entity: "Question", entityId: q.id });
  return { ok: true as const };
}

/** Edit an existing question. */
export async function updateQuestion(input: {
  id: string;
  theme: string;
  pillar: Pillar;
  prompt: string;
  benefit: string;
  active?: boolean;
}) {
  const principal = await requireCapability("assessment:manage");
  const parsed = z
    .object({
      id: z.string(),
      theme: z.string().min(1),
      pillar: pillarEnum,
      prompt: z.string().min(1),
      benefit: z.string().min(1),
      active: z.boolean().optional(),
    })
    .parse(input);
  await db.question.update({
    where: { id: parsed.id },
    data: {
      theme: parsed.theme,
      pillar: parsed.pillar,
      color: PILLAR_COLOR[parsed.pillar],
      prompt: parsed.prompt,
      benefit: parsed.benefit,
      active: parsed.active ?? undefined,
    },
  });
  await audit({ actorId: principal.id, action: "question.update", entity: "Question", entityId: parsed.id });
  return { ok: true as const };
}

/** Delete a question. The live signup assessment updates immediately. */
export async function deleteQuestion(id: string) {
  const principal = await requireCapability("assessment:manage");
  await db.question.delete({ where: { id } });
  await audit({ actorId: principal.id, action: "question.delete", entity: "Question", entityId: id });
  return { ok: true as const };
}
