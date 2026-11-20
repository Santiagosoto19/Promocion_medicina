"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { awardVotes, awards, students } from "@/db/schema";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/client-ip";
import { hitRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  awardId: z.uuid(),
  voterStudentId: z.uuid(),
  nomineeStudentId: z.uuid(),
});

// Un voto por persona y por categoría. Solo mientras la votación esté abierta.
export async function castVote(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa tu voto." };
  const { awardId, voterStudentId, nomineeStudentId } = parsed.data;
  if (voterStudentId === nomineeStudentId) return { ok: false, error: "No puedes votar por ti mismo." };

  const ip = await clientIp();
  if (!(await hitRateLimit(`voto:ip:${ip}`, 60, 60 * 60 * 1000))) return { ok: false, error: "Demasiados votos desde esta conexión." };

  const [award] = await db.select({ status: awards.status }).from(awards).where(eq(awards.id, awardId)).limit(1);
  if (!award || award.status !== "open") return { ok: false, error: "Esta votación no está abierta." };

  const [existing] = await db
    .select({ id: awardVotes.id })
    .from(awardVotes)
    .where(and(eq(awardVotes.awardId, awardId), eq(awardVotes.voterStudentId, voterStudentId)))
    .limit(1);
  if (existing) return { ok: false, error: "Ya votaste en esta categoría." };

  const [nominee] = await db.select({ id: students.id }).from(students).where(eq(students.id, nomineeStudentId)).limit(1);
  if (!nominee) return { ok: false, error: "Esa persona no está en la lista." };

  await db.insert(awardVotes).values({ awardId, voterStudentId, nomineeStudentId }).onConflictDoNothing();
  await audit({ actor: "estudiante", action: "premio.voto", entity: "awards", entityId: awardId, ip, detail: { voterStudentId } });
  revalidatePath("/premios");
  return { ok: true };
}
