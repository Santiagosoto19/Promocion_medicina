import { and, desc, eq } from "drizzle-orm";
import { MedicalFloaters } from "@/components/medico/floaters";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { MosaicoVista } from "./mosaico-vista";

// Sin parámetros en la URL: la página se guarda en caché y la vista se cambia en el navegador.
export const revalidate = 10;

// Mosaico de la promoción. Usa siempre la miniatura (thumb): nunca el original.
export default async function MosaicoPage() {
  const rows = await db
    .select({
      id: memories.id,
      path: memories.imagekitFilePath,
      studentName: students.fullName,
      nickname: students.nickname,
      title: memories.title,
    })
    .from(memories)
    .innerJoin(students, eq(students.id, memories.studentId))
    .where(and(eq(memories.status, "approved"), eq(memories.type, "photo")))
    .orderBy(desc(memories.createdAt))
    .limit(400);

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-paper px-4 py-10">
      <MedicalFloaters />
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 className="mt-2 page-title font-display text-5xl">Mosaico</h1>
          <p className="mt-2 text-muted">{rows.length} fotos de la promoción</p>
        </header>
        <div className="mt-8">
          <MosaicoVista rows={rows} />
        </div>
      </div>
    </main>
  );
}
