"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/client-ip";
import { hitRateLimit } from "@/lib/rate-limit";
import { MAX_POINTS_PER_STROKE, MAX_STROKES, parseStrokes } from "@/lib/strokes";

const schema = z.object({
  studentId: z.uuid(),
  strokes: z.string().min(2).max(60_000),
  phrase: z.string().trim().max(140).optional(),
});

export type SignResult = { ok: true; status: "pending" | "approved" } | { ok: false; error: string };

export async function saveSignature(input: unknown): Promise<SignResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Faltan datos para guardar la firma." };
  const { studentId, strokes: rawStrokes, phrase } = parsed.data;

  const ip = await clientIp();
  if (!(await hitRateLimit(`firma:ip:${ip}`, 20, 60 * 60 * 1000))) {
    return { ok: false, error: "Demasiadas firmas desde esta conexión. Intenta más tarde." };
  }

  const strokes = parseStrokes(rawStrokes);
  if (!strokes) return { ok: false, error: "Dibuja tu firma antes de guardarla." };
  // Guardamos solo los trazos ya limpios, con sus límites.
  const body = JSON.stringify({ v: 1, strokes: strokes.slice(0, MAX_STROKES).map((s) => s.slice(0, MAX_POINTS_PER_STROKE)) });

  const [student] = await db.select({ id: students.id }).from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return { ok: false, error: "No encontramos tu nombre en la lista." };

  const settings = await getSettings();
  const status = settings.moderationRequired ? "pending" : "approved";

  const [memory] = await db
    .insert(memories)
    .values({
      studentId,
      type: "signature",
      title: phrase || null,
      body,
      status,
      moderatedAt: status === "approved" ? new Date() : null,
    })
    .returning({ id: memories.id });

  await audit({ actor: "estudiante", action: "firma.guardada", entity: "memories", entityId: memory.id, ip, detail: { studentId, status } });
  revalidatePath("/firma");
  revalidatePath("/admin/moderacion");
  return { ok: true, status };
}
