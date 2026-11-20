import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { MedicalFloaters } from "@/components/medico/floaters";
import Link from "next/link";
import { db } from "@/db";
import { memories, reactions, students } from "@/db/schema";
import { GaleriaView, type GaleriaItem } from "./galeria-view";

export const dynamic = "force-dynamic";

const TYPES = ["photo", "video", "audio"] as const;

export default async function GaleriaPage({
  searchParams,
}: {
  searchParams: Promise<{ alumno?: string; tipo?: string }>;
}) {
  const { alumno, tipo } = await searchParams;
  const typeFilter = TYPES.find((t) => t === tipo);
  const studentFilter = alumno && /^[0-9a-f-]{36}$/i.test(alumno) ? alumno : undefined;

  // Firmas y mensajes viven en la bata y en el muro, no en la galería.
  const conditions = [eq(memories.status, "approved"), ne(memories.type, "signature"), ne(memories.type, "message")];
  if (typeFilter) conditions.push(eq(memories.type, typeFilter));
  if (studentFilter) conditions.push(eq(memories.studentId, studentFilter));

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
    .where(and(...conditions))
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
    studentName: r.studentName,
    nickname: r.nickname,
    counts: countMap[r.id] ?? {},
  }));

  const studentList = await db
    .select({ id: students.id, fullName: students.fullName })
    .from(students)
    .orderBy(asc(students.fullName));

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-paper px-4 py-10">
      <MedicalFloaters />
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mt-2 page-title font-display text-4xl">Galería</h1>
          </div>
          <form className="flex flex-wrap gap-2" method="get">
            <select aria-label="Filtrar por estudiante" name="alumno" defaultValue={studentFilter ?? ""} className="bb-input !w-auto !min-h-10 !py-2 text-sm">
              <option value="">Todos los estudiantes</option>
              {studentList.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
            <select aria-label="Filtrar por tipo" name="tipo" defaultValue={typeFilter ?? ""} className="bb-input !w-auto !min-h-10 !py-2 text-sm">
              <option value="">Todo</option>
              <option value="photo">Fotos</option>
              <option value="video">Videos</option>
              <option value="audio">Notas de voz</option>
            </select>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Filtrar</button>
          </form>
        </header>

        <nav className="mt-8 flex flex-wrap gap-1" aria-label="Tipo de recuerdo">
          {[
            { href: "/galeria", label: "Todos", active: !typeFilter },
            { href: "/galeria?tipo=photo", label: "Fotos", active: typeFilter === "photo" },
            { href: "/galeria?tipo=video", label: "Videos", active: typeFilter === "video" },
            { href: "/galeria?tipo=audio", label: "Notas de voz", active: typeFilter === "audio" },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-t-xl border border-b-0 px-5 py-3 text-sm font-medium transition ${t.active ? "border-line bg-white text-primary shadow-sm" : "border-transparent bg-surface text-muted hover:text-text"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8">
          {items.length === 0 ? (
            <p className="py-16 text-center text-muted">No hay recuerdos con estos filtros todavía. ¿Tienes alguno? 📸</p>
          ) : (
            <GaleriaView items={items} />
          )}
        </div>
      </div>
    </main>
  );
}
