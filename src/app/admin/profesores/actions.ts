"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

export type TeacherState = { ok?: boolean; error?: string } | undefined;

export async function addTeacher(_prev: TeacherState, formData: FormData): Promise<TeacherState> {
  const actor = await adminActor();
  const parsed = z.object({ name: z.string().trim().min(2).max(120), subject: z.string().trim().max(120).optional() }).safeParse({
    name: formData.get("name"),
    subject: formData.get("subject") || undefined,
  });
  if (!parsed.success) return { error: "Escribe el nombre del profesor." };
  const [row] = await db.insert(teachers).values({ name: parsed.data.name, subject: parsed.data.subject || null }).returning({ id: teachers.id });
  await audit({ actor, action: "profesor.agregado", entity: "teachers", entityId: row.id, detail: { name: parsed.data.name } });
  revalidatePath("/profesores");
  revalidatePath("/admin/profesores");
  return { ok: true };
}

export async function removeTeacher(id: string): Promise<void> {
  const actor = await adminActor();
  const [removed] = await db.delete(teachers).where(eq(teachers.id, id)).returning({ name: teachers.name });
  await audit({ actor, action: "profesor.eliminado", entity: "teachers", entityId: id, detail: { name: removed?.name } });
  revalidatePath("/profesores");
  revalidatePath("/admin/profesores");
}
