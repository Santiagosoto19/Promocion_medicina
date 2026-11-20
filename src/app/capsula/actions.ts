"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { capsuleLetters, students } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/client-ip";
import { hitRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  studentId: z.uuid(),
  body: z.string().trim().min(10, "Escribe una carta un poco más larga.").max(3000),
});

export async function saveCapsuleLetter(input: unknown): Promise<{ ok: true; status: "pending" | "approved" } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa la carta." };
  const { studentId, body } = parsed.data;

  const ip = await clientIp();
  if (!(await hitRateLimit(`capsula:ip:${ip}`, 10, 60 * 60 * 1000))) return { ok: false, error: "Demasiadas cartas desde esta conexión." };

  const [student] = await db.select({ id: students.id }).from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return { ok: false, error: "No encontramos tu nombre en la lista." };

  const settings = await getSettings();
  const status = settings.moderationRequired ? "pending" : "approved";
  const [row] = await db.insert(capsuleLetters).values({ studentId, body, status }).returning({ id: capsuleLetters.id });
  await audit({ actor: "estudiante", action: "capsula.guardada", entity: "capsule_letters", entityId: row.id, ip, detail: { studentId, status } });
  revalidatePath("/capsula");
  revalidatePath("/admin/moderacion");
  return { ok: true, status };
}
