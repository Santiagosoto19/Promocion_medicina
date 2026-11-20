import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { guestbook } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-session";
import { setGuestStatus } from "./actions";

export default async function VisitasAdmin() {
  await requireAdmin();
  const list = await db.select().from(guestbook).orderBy(desc(guestbook.createdAt)).limit(300);
  const pending = list.filter((g) => g.status === "pending");
  const others = list.filter((g) => g.status !== "pending");

  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
        <h1 className="page-title font-display text-3xl">Libro de visitas</h1>
        <section>
          <h2 className="font-display text-xl text-secondary">Por revisar ({pending.length})</h2>
          <ul className="mt-4 space-y-3">
            {pending.map((g) => (
              <li key={g.id} className="paper-card p-4">
                <p className="whitespace-pre-line text-text">{g.body}</p>
                <p className="mt-1 text-sm text-muted">— {g.authorName}{g.relationship ? `, ${g.relationship}` : ""}</p>
                <div className="mt-3 flex gap-2">
                  <form action={setGuestStatus.bind(null, g.id, "approved")}><button className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white">Aprobar</button></form>
                  <form action={setGuestStatus.bind(null, g.id, "hidden")}><button className="rounded-lg border border-line px-3 py-1.5 text-sm">Ocultar</button></form>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl text-secondary">Publicados u ocultos</h2>
          <ul className="mt-4 divide-y divide-line paper-card">
            {others.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="bb-label">{g.authorName} · <span className="text-muted">{g.status === "approved" ? "publicado" : "oculto"}</span></span>
                <form action={setGuestStatus.bind(null, g.id, g.status === "approved" ? "hidden" : "approved")}>
                  <button className="rounded-lg border border-line px-3 py-1 text-sm">{g.status === "approved" ? "Ocultar" : "Publicar"}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
