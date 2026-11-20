import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-session";
import { ModeracionLista } from "./moderacion-lista";

export const dynamic = "force-dynamic";

export default async function ModeracionPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: memories.id,
      status: memories.status,
      title: memories.title,
      body: memories.body,
      type: memories.type,
      publicId: memories.cloudinaryPublicId,
      path: memories.imagekitFilePath,
      width: memories.width,
      height: memories.height,
      createdAt: memories.createdAt,
      studentName: students.fullName,
    })
    .from(memories)
    .innerJoin(students, eq(students.id, memories.studentId))
    .where(inArray(memories.status, ["pending", "hidden", "approved"]))
    .orderBy(desc(memories.createdAt))
    .limit(400);

  const pending = rows.filter((r) => r.status === "pending");
  const hidden = rows.filter((r) => r.status === "hidden");
  const published = rows.filter((r) => r.status === "approved");

  return (
    <main className="min-h-dvh px-4 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <p className="text-[13px] font-semibold tracking-wider text-muted uppercase">Panel / Moderación</p>
          <h1 className="mt-1 page-title font-display text-3xl">Moderación</h1>
          <p className="mt-1 text-muted">{pending.length} por revisar · {published.length} publicados · {hidden.length} ocultos</p>
        </header>
        <ModeracionLista
          pendientes={pending.map((p) => ({ ...p, studentName: p.studentName, body: p.body }))}
          ocultos={hidden.map((p) => ({ ...p, studentName: p.studentName, body: p.body }))}
          publicados={published.map((p) => ({ ...p, studentName: p.studentName, body: p.body }))}
        />
      </div>
    </main>
  );
}
