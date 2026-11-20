import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-session";
import { addTeacher, removeTeacher } from "./actions";
import { TeacherForm } from "./teacher-form";

export default async function ProfesoresAdmin() {
  await requireAdmin();
  const list = await db.select().from(teachers).orderBy(asc(teachers.orderIndex), asc(teachers.name));
  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
        <h1 className="page-title font-display text-3xl">Profesores</h1>
        <div className="paper-card p-5"><TeacherForm action={addTeacher} /></div>
        <ul className="divide-y divide-line paper-card">
          {list.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-text">{t.name}{t.subject ? <span className="text-muted"> · {t.subject}</span> : null}</span>
              <form action={removeTeacher.bind(null, t.id)}>
                <button className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50">Quitar</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
