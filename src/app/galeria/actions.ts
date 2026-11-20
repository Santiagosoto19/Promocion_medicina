"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { memories, reactions } from "@/db/schema";
import { hitRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

import { REACTION_EMOJIS } from "@/lib/reactions";

const schema = z.object({
  memoryId: z.uuid(),
  emoji: z.enum(REACTION_EMOJIS),
  deviceId: z.string().min(8).max(100),
});

export type ReactionResult = { ok: true; active: boolean; count: number } | { ok: false; error: string };

// Alterna una reacción. Solo recuerdos aprobados; un dispositivo no puede inflar el conteo.
export async function toggleReaction(input: unknown): Promise<ReactionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "No se pudo registrar la reacción." };
  const { memoryId, emoji, deviceId } = parsed.data;

  const ip = await clientIp();
  if (!(await hitRateLimit(`reaccion:ip:${ip}`, 300, 60 * 60 * 1000))) {
    return { ok: false, error: "Demasiadas reacciones seguidas. Espera un momento." };
  }

  const [memory] = await db
    .select({ status: memories.status })
    .from(memories)
    .where(eq(memories.id, memoryId))
    .limit(1);
  if (!memory || memory.status !== "approved") return { ok: false, error: "Este recuerdo ya no está disponible." };

  const [existing] = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(and(eq(reactions.memoryId, memoryId), eq(reactions.emoji, emoji), eq(reactions.deviceId, deviceId)))
    .limit(1);

  let active: boolean;
  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    active = false;
  } else {
    await db.insert(reactions).values({ memoryId, emoji, deviceId }).onConflictDoNothing();
    active = true;
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(reactions)
    .where(and(eq(reactions.memoryId, memoryId), eq(reactions.emoji, emoji)));

  revalidatePath("/", "layout");
  revalidatePath("/galeria");
  return { ok: true, active, count: Number(total) };
}
