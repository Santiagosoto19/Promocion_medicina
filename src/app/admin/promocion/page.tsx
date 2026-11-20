import { asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-session";
import { createStudent } from "./actions";
import { StudentForm } from "./student-form";

export default async function PromocionPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      nickname: students.nickname,
      total: sql<number>`count(${memories.id})::int`,
    })
    .from(students)
    .leftJoin(memories, eq(memories.studentId, students.id))
    .groupBy(students.id)
    .orderBy(asc(students.orderIndex), asc(students.fullName));

  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
          <h1 className="mt-2 page-title font-display text-3xl">Promoción</h1>
          <p className="mt-1 text-muted">{rows.length} estudiantes en la lista.</p>
        </header>

        <section>
          <h2 className="font-display text-xl text-secondary">Agregar estudiante</h2>
          <div className="mt-4 paper-card p-5">
            <StudentForm action={createStudent} submitLabel="Agregar" />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-secondary">Lista</h2>
          <ul className="mt-4 divide-y divide-line paper-card">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-text">{r.fullName}{r.nickname ? <span className="text-muted"> · {r.nickname}</span> : null}</p>
                  <p className="text-xs text-muted">{r.total} {r.total === 1 ? "recuerdo" : "recuerdos"}</p>
                </div>
                <Link href={`/admin/promocion/${r.id}`} className="text-sm text-primary hover:underline">Editar</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
