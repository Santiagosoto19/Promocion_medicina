import { asc, desc, eq, inArray, ne, sql, and } from "drizzle-orm";
import { MedicalFloaters } from "@/components/medico/floaters";
import { db } from "@/db";
import { memories, reactions, students } from "@/db/schema";
import { type GaleriaItem } from "./galeria-view";
import { GaleriaFiltrable } from "./galeria-filtrable";

// Sin parámetros en la URL: la página se guarda en caché y los filtros se hacen en el navegador.
export const revalidate = 10;

export default async function GaleriaPage() {
  // Firmas y mensajes viven en la bata y en el muro, no en la galería.
  const rows = await db
    .select({
      id: memories.id,
      type: memories.type,
      title: memories.title,
      body: memories.body,
      path: memories.imagekitFilePath,
      publicId: memories.cloudinaryPublicId,
      width: memories.width,
      height: memories.height,
      studentId: students.id,
      studentName: students.fullName,
      nickname: students.nickname,
    })
    .from(memories)
    .innerJoin(students, eq(students.id, memories.studentId))
    .where(and(eq(memories.status, "approved"), ne(memories.type, "signature"), ne(memories.type, "message")))
    .orderBy(desc(memories.createdAt))
    .limit(300);

  const counts = rows.length
    ? await db
        .select({ memoryId: reactions.memoryId, emoji: reactions.emoji, total: sql<number>`count(*)::int` })
        .from(reactions)
        .where(inArray(reactions.memoryId, rows.map((r) => r.id)))
        .groupBy(reactions.memoryId, reactions.emoji)
    : [];

  const countMap: Record<string, Record<string, number>> = {};
  for (const c of counts) {
    (countMap[c.memoryId] ??= {})[c.emoji] = c.total;
  }

  const items: GaleriaItem[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    path: r.path,
    publicId: r.publicId,
    width: r.width,
    height: r.height,
    studentId: r.studentId,
    studentName: r.studentName,
    nickname: r.nickname,
    counts: countMap[r.id] ?? {},
  }));

  const estudiantes = await db
    .select({ id: students.id, fullName: students.fullName })
    .from(students)
    .orderBy(asc(students.fullName));

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-paper px-4 py-10">
      <MedicalFloaters />
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 className="mt-2 page-title font-display text-4xl">Galería</h1>
        </header>
        <GaleriaFiltrable items={items} estudiantes={estudiantes} />
      </div>
    </main>
  );
}
