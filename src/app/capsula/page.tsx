import { and, asc, count, eq } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { Sello } from "@/components/sello";
import { db } from "@/db";
import { capsuleLetters, students } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { CapsuleForm } from "./capsule-form";

export const revalidate = 10;

// Las cartas no se consultan hasta la fecha de apertura: se valida aquí, en el servidor.
export default async function CapsulaPage() {
  const settings = await getSettings();
  const openAt = settings.capsuleOpenAt;
  const isOpen = openAt !== null && openAt.getTime() <= Date.now();
  const list = await db.select({ id: students.id, fullName: students.fullName, nickname: students.nickname }).from(students).orderBy(asc(students.orderIndex), asc(students.fullName));

  let letters: { id: string; body: string; studentName: string }[] = [];
  let sealedCount = 0;
  if (isOpen) {
    letters = await db
      .select({ id: capsuleLetters.id, body: capsuleLetters.body, studentName: students.fullName })
      .from(capsuleLetters)
      .innerJoin(students, eq(students.id, capsuleLetters.studentId))
      .where(eq(capsuleLetters.status, "approved"))
      .orderBy(asc(capsuleLetters.createdAt));
  } else {
    const [{ total }] = await db.select({ total: count() }).from(capsuleLetters).where(and(eq(capsuleLetters.status, "approved")));
    sealedCount = Number(total);
  }

  const fecha = openAt ? openAt.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" }) : "la fecha que defina la promoción";
  return (
    <PageShell eyebrow="Para tu yo del futuro" title="Cápsula del tiempo" lede={`Quedará sellada hasta ${fecha}.`} width="max-w-2xl">
        {isOpen ? (
          <section className="mt-10 space-y-5">
            {letters.length === 0 && <p className="text-muted">No hay cartas publicadas todavía.</p>}
            {letters.map((l) => (
              <article key={l.id} className="rounded-md border border-line bg-white p-6 shadow-sm">
                <p className="font-hand text-2xl leading-snug whitespace-pre-line text-text">{l.body}</p>
                <p className="mt-3 text-sm text-muted">— {l.studentName}</p>
              </article>
            ))}
          </section>
        ) : (
          <div className="mt-10 flex flex-col items-center paper-card p-8 text-center">
            <Sello size={112}>✦</Sello>
            <p className="mt-5 font-display text-xl text-secondary">
              {sealedCount} {sealedCount === 1 ? "carta sellada" : "cartas selladas"}
            </p>
            <p className="mt-1 text-sm text-muted">Se abrirán juntas en la fecha de apertura.</p>
          </div>
        )}

        <section className="mt-12 paper-card p-5">
          <h2 className="font-display text-xl text-secondary">Escribe tu carta</h2>
          <div className="mt-4">
            <CapsuleForm students={list} />
          </div>
        </section>
    </PageShell>
  );
}
