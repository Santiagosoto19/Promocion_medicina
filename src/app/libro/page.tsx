import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { imageUrl } from "@/lib/image-sizes";
import { PrintButton } from "./print-button";

export const revalidate = 10;

// Libro para imprimir o guardar como PDF desde el navegador (Ctrl+P → Guardar como PDF).
export default async function LibroPage() {
  const settings = await getSettings();
  const [photos, messages] = await Promise.all([
    db
      .select({ path: memories.imagekitFilePath, studentName: students.fullName })
      .from(memories)
      .innerJoin(students, eq(students.id, memories.studentId))
      .where(and(eq(memories.status, "approved"), eq(memories.type, "photo")))
      .orderBy(asc(students.fullName))
      .limit(300),
    db
      .select({ body: memories.body, title: memories.title, studentName: students.fullName })
      .from(memories)
      .innerJoin(students, eq(students.id, memories.studentId))
      .where(and(eq(memories.status, "approved"), eq(memories.type, "message"), ne(memories.body, "")))
      .orderBy(desc(memories.createdAt))
      .limit(300),
  ]);

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-text print:p-0">
      <div className="print:hidden">
        <PrintButton />
      </div>
      <section className="flex min-h-[90vh] flex-col items-center justify-center break-after-page text-center">
        <p className="font-hand text-xl text-muted">Promoción de Medicina, Universidad de Sucre</p>
        <h1 className="mt-4 font-display text-6xl text-secondary">{settings.siteName}</h1>
        <p className="mt-4 font-hand text-3xl text-primary">Libro de recuerdos</p>
      </section>

      <section className="break-after-page py-8">
        <h2 className="page-title font-display text-3xl">Fotos</h2>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {photos.map((p, i) =>
            p.path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={imageUrl(p.path, "gallery")} alt={p.studentName} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
            ) : null,
          )}
        </div>
      </section>

      <section className="py-8">
        <h2 className="page-title font-display text-3xl">Mensajes</h2>
        <div className="mt-6 space-y-5">
          {messages.map((m, i) => (
            <div key={i} className="break-inside-avoid border-b border-line pb-4">
              {m.title && <p className="font-hand text-xl text-primary">Para {m.title}</p>}
              <p className="whitespace-pre-line font-hand text-2xl leading-snug">{m.body}</p>
              <p className="mt-2 text-sm text-muted">— {m.studentName}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
