import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { students } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { requireAdmin } from "@/lib/admin-session";
import { setLiveCall } from "./actions";
import { ControlLlamado } from "./control-llamado";

export const dynamic = "force-dynamic";

export default async function CeremoniaPage() {
  await requireAdmin();
  const [settings, list] = await Promise.all([
    getSettings(),
    db.select({ id: students.id, fullName: students.fullName, nickname: students.nickname }).from(students).orderBy(asc(students.orderIndex), asc(students.fullName)),
  ]);

  const current = list.find((s) => s.id === settings.liveCallStudentId);

  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
          <h1 className="mt-2 page-title font-display text-3xl">Modo ceremonia</h1>
          <p className="mt-2 text-muted">
            Pantalla para proyectar: <Link href="/en-vivo" target="_blank" className="font-medium text-primary underline underline-offset-4">abrir /en-vivo</Link>
          </p>
        </header>

        <section className="paper-card p-5">
          <p className="text-sm text-muted">Llamado actual</p>
          <p className="mt-1 font-display text-2xl text-secondary">{current ? current.fullName : "Ninguno"}</p>
          {current && (
            <form action={setLiveCall.bind(null, null)} className="mt-3">
              <button className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-paper">Cerrar llamado</button>
            </form>
          )}
        </section>

        <ControlLlamado lista={list} actualId={settings.liveCallStudentId ?? null} />

        <section>
          <h2 className="font-display text-xl text-secondary">Llamado a lista</h2>
          <ul className="mt-4 divide-y divide-line paper-card">
            {list.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-text">{s.fullName}{s.nickname ? <span className="text-muted"> · {s.nickname}</span> : null}</span>
                <form action={setLiveCall.bind(null, s.id)}>
                  <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:brightness-110">Llamar</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
