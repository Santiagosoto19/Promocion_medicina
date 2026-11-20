"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings, students } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

// Llama a un estudiante (o cierra el llamado con null) en la pantalla de la ceremonia.
export async function setLiveCall(studentId: string | null): Promise<void> {
  const actor = await adminActor();

  let name: string | null = null;
  if (studentId) {
    const [s] = await db.select({ fullName: students.fullName }).from(students).where(eq(students.id, studentId)).limit(1);
    if (!s) return;
    name = s.fullName;
  }

  await db
    .update(siteSettings)
    .set({ liveCallStudentId: studentId, liveCallAt: studentId ? new Date() : null })
    .where(eq(siteSettings.id, 1));

  await audit({
    actor,
    action: studentId ? "ceremonia.llamado" : "ceremonia.llamado_cerrado",
    entity: "students",
    entityId: studentId ?? undefined,
    detail: { fullName: name },
  });
  revalidatePath("/", "layout");
  revalidatePath("/en-vivo");
  revalidatePath("/admin/ceremonia");
}
