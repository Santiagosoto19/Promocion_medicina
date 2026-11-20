"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

export type StudentFormState = { error?: string; ok?: boolean } | undefined;

const studentSchema = z.object({
  fullName: z.string().trim().min(2, "Escribe el nombre completo.").max(120),
  nickname: z.string().trim().max(60).optional(),
  quote: z.string().trim().max(200).optional(),
  specialRole: z.string().trim().max(60).optional(),
  orderIndex: z.coerce.number().int().min(0).max(9999),
});

function parseStudent(formData: FormData) {
  return studentSchema.safeParse({
    fullName: formData.get("fullName"),
    nickname: formData.get("nickname") ?? undefined,
    quote: formData.get("quote") ?? undefined,
    specialRole: formData.get("specialRole") ?? undefined,
    orderIndex: formData.get("orderIndex") || 0,
  });
}

function slugify(text: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return base || "estudiante";
}

export async function createStudent(_prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const actor = await adminActor();
  const parsed = parseStudent(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const data = parsed.data;

  let slug = slugify(data.fullName);
  const [taken] = await db.select({ id: students.id }).from(students).where(eq(students.slug, slug)).limit(1);
  if (taken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const [created] = await db
    .insert(students)
    .values({
      fullName: data.fullName,
      nickname: data.nickname || null,
      quote: data.quote || null,
      specialRole: data.specialRole || null,
      orderIndex: data.orderIndex,
      slug,
    })
    .returning({ id: students.id });

  await audit({ actor, action: "estudiante.creado", entity: "students", entityId: created.id, detail: { fullName: data.fullName } });
  revalidatePath("/subir");
  revalidatePath("/admin/promocion");
  return { ok: true };
}

export async function updateStudent(id: string, _prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const actor = await adminActor();
  const parsed = parseStudent(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const data = parsed.data;

  await db
    .update(students)
    .set({
      fullName: data.fullName,
      nickname: data.nickname || null,
      quote: data.quote || null,
      specialRole: data.specialRole || null,
      orderIndex: data.orderIndex,
    })
    .where(eq(students.id, id));

  await audit({ actor, action: "estudiante.editado", entity: "students", entityId: id, detail: { fullName: data.fullName } });
  revalidatePath("/subir");
  revalidatePath("/admin/promocion");
  return { ok: true };
}

// Nunca se borra a alguien que tenga recuerdos: sus fotos quedarían huérfanas.
export async function deleteStudent(id: string): Promise<StudentFormState> {
  const actor = await adminActor();
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(memories)
    .where(eq(memories.studentId, id));

  if (total > 0) {
    return {
      error: `No se puede quitar: tiene ${total} ${total === 1 ? "recuerdo" : "recuerdos"}. Se protegen para no perderlos.`,
    };
  }

  const [removed] = await db.delete(students).where(eq(students.id, id)).returning({ fullName: students.fullName });
  await audit({ actor, action: "estudiante.eliminado", entity: "students", entityId: id, detail: { fullName: removed?.fullName } });
  revalidatePath("/subir");
  revalidatePath("/admin/promocion");
  redirect("/admin/promocion");
}
