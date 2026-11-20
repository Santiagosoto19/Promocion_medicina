import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { PageShell } from "@/components/page-shell";
import { RevealGroup } from "@/components/reveal-group";
import { tiltFor } from "@/lib/tilt";

export const revalidate = 10;

export default async function ProfesoresPage() {
  const list = await db.select().from(teachers).orderBy(asc(teachers.orderIndex), asc(teachers.name));
  return (
    <PageShell
      eyebrow="Agradecimientos"
      title="Profesores"
      lede={<>Escribe un mensaje a quien te acompañó en el <Link href="/mensajes" className="-my-3 inline-block py-3 text-primary underline">muro de recetas</Link>.</>}
    >
      {list.length === 0 ? (
        <p className="text-muted">Pronto aparecerán aquí.</p>
      ) : (
        <RevealGroup className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => {
            const { rotate } = tiltFor(t.id);
            return (
              <div key={t.id} data-reveal className="paper-card flex flex-col items-center p-6 text-center" style={{ transform: `rotate(${rotate / 2}deg)` }}>
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold/30 to-primary/20 font-display text-2xl text-secondary ring-4 ring-white shadow-md" aria-hidden="true">
                  {t.name.split(" ").filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                </span>
                <p className="mt-4 font-display text-xl text-secondary">{t.name}</p>
                {t.subject && <p className="mt-1 font-hand text-xl text-primary">{t.subject}</p>}
              </div>
            );
          })}
        </RevealGroup>
      )}
    </PageShell>
  );
}
