import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { awards } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-session";
import { addAward, setAwardStatus } from "./actions";
import { AwardForm } from "./award-form";

export default async function PremiosAdmin() {
  await requireAdmin();
  const list = await db.select().from(awards).orderBy(asc(awards.orderIndex), asc(awards.createdAt));
  const next = { open: "closed", closed: "revealed", revealed: "open" } as const;
  const label = { open: "Abierta", closed: "Cerrada", revealed: "Revelada" } as const;

  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
        <h1 className="page-title font-display text-3xl">Premios</h1>
        <div className="paper-card p-5">
          <AwardForm action={addAward} />
        </div>
        <ul className="divide-y divide-line paper-card">
          {list.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-text">{a.title}</p>
                <p className="text-xs text-muted">{label[a.status as keyof typeof label] ?? a.status}</p>
              </div>
              <form action={setAwardStatus.bind(null, a.id, next[a.status as keyof typeof next] ?? "open")}>
                <button className="rounded-lg border border-line px-3 py-1 text-sm hover:bg-surface">
                  {a.status === "open" ? "Cerrar votación" : a.status === "closed" ? "Revelar ganador" : "Reabrir"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
