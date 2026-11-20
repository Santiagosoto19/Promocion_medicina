import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { timelineEvents } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-session";
import { addEvent, deleteEvent } from "./actions";
import { EventForm } from "./event-form";

export default async function LineaAdmin() {
  await requireAdmin();
  const events = await db.select().from(timelineEvents).orderBy(asc(timelineEvents.orderIndex), asc(timelineEvents.createdAt));

  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
        <h1 className="page-title font-display text-3xl">Línea de tiempo</h1>
        <div className="paper-card p-5">
          <EventForm action={addEvent} />
        </div>
        <ul className="divide-y divide-line paper-card">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-text">{e.title}</p>
                {e.eventDate && <p className="text-xs text-muted">{e.eventDate}</p>}
              </div>
              <form action={deleteEvent.bind(null, e.id)}>
                <button className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50">Quitar</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
