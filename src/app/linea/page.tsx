import { asc } from "drizzle-orm";
import { db } from "@/db";
import { timelineEvents } from "@/db/schema";
import { PageShell } from "@/components/page-shell";
import { RevealGroup } from "@/components/reveal-group";
import { tiltFor } from "@/lib/tilt";

export const dynamic = "force-dynamic";

// Historia clínica de la promoción: hitos alternados a ambos lados de la línea, como notas en un expediente.
export default async function LineaPage() {
  const events = await db.select().from(timelineEvents).orderBy(asc(timelineEvents.orderIndex), asc(timelineEvents.createdAt));

  return (
    <PageShell eyebrow="Registro de evolución" title="Historia clínica de la promoción" lede="Cada semestre, una nota en el expediente." width="max-w-3xl">
      {events.length === 0 ? (
        <p className="text-muted">Aún no hay hitos registrados.</p>
      ) : (
        <RevealGroup className="relative">
          <span className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/50 to-transparent" aria-hidden="true" />
          <ol>
            {events.map((e, i) => {
              const { rotate } = tiltFor(e.id);
              return (
                <li key={e.id} data-reveal className={`relative mb-12 flex w-full ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <span className="absolute top-6 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-gold bg-paper shadow-md" aria-hidden="true" />
                  <div className="paper-card w-[calc(50%-1.75rem)] p-5" style={{ transform: `rotate(${rotate / 2}deg)` }}>
                    {e.eventDate && <p className="font-mono text-xs text-muted">{e.eventDate}</p>}
                    <h2 className="mt-1 font-display text-xl text-secondary">{e.title}</h2>
                    {e.description && <p className="mt-2 font-hand text-xl leading-snug text-text">{e.description}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </RevealGroup>
      )}
    </PageShell>
  );
}
