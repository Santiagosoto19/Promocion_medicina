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

const schema = z.object({
  studentId: z.uuid(),
  text: z.string().trim().min(3, "Escribe un mensaje un poco más largo.").max(500),
  recipient: z.string().trim().max(80).optional(),
});

export type MessageResult = { ok: true; status: "pending" | "approved" } | { ok: false; error: string };

// Mensajes en texto plano (sin HTML). Se muestran como notas, siempre con el autor.
export async function saveMessage(input: unknown): Promise<MessageResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa el mensaje." };
  const { studentId, text, recipient } = parsed.data;

  const ip = await clientIp();
  if (!(await hitRateLimit(`mensaje:ip:${ip}`, 30, 60 * 60 * 1000))) {
    return { ok: false, error: "Demasiados mensajes desde esta conexión. Intenta más tarde." };
  }

  const [student] = await db.select({ id: students.id }).from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return { ok: false, error: "No encontramos tu nombre en la lista." };

  const settings = await getSettings();
  const status = settings.moderationRequired ? "pending" : "approved";

  const [memory] = await db
    .insert(memories)
    .values({
      studentId,
      type: "message",
      title: recipient || null,
      body: text,
      status,
      moderatedAt: status === "approved" ? new Date() : null,
    })
    .returning({ id: memories.id });

  await audit({ actor: "estudiante", action: "mensaje.guardado", entity: "memories", entityId: memory.id, ip, detail: { studentId, status } });
  revalidatePath("/mensajes");
  revalidatePath("/admin/moderacion");
  return { ok: true, status };
}
