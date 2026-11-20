import { and, asc, desc, eq } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { NotaReceta } from "@/components/nota-receta";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { MessageForm } from "./message-form";

export const revalidate = 10;

// Rotación y desplazamiento estables por recuerdo, para que no cambien entre visitas.
function note(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { rotate: (h % 9) - 4, tone: ["bg-white", "bg-[#fff8e1]", "bg-[#fdeff3]", "bg-[#eef7f8]"][h % 4] };
}

export default async function MensajesPage() {
  const [list, rows] = await Promise.all([
    db.select({ id: students.id, fullName: students.fullName, nickname: students.nickname }).from(students).orderBy(asc(students.orderIndex), asc(students.fullName)),
    db
      .select({ id: memories.id, title: memories.title, body: memories.body, studentName: students.fullName, nickname: students.nickname })
      .from(memories)
      .innerJoin(students, eq(students.id, memories.studentId))
      .where(and(eq(memories.status, "approved"), eq(memories.type, "message")))
      .orderBy(desc(memories.createdAt))
      .limit(300),
  ]);

  return (
    <PageShell eyebrow="Dedicatorias" title="Muro de recetas" lede="Para la promoción, un compañero o tu yo del futuro." width="max-w-5xl">
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="paper-card p-5">
            <h2 className="font-display text-xl text-secondary">Escribe tu mensaje</h2>
            <div className="mt-4">
              <MessageForm students={list} />
            </div>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2">
            {rows.length === 0 && <li className="text-muted">Aún no hay mensajes aprobados.</li>}
            {rows.map((r) => {
              const n = note(r.id);
              return (
                <li key={r.id}>
                  <NotaReceta para={r.title?.replace(/^\[Demo\] /, "") ?? undefined} firma={`${r.studentName}${r.nickname ? ` · ${r.nickname}` : ""}`} rotate={n.rotate}>
                    {r.body}
                  </NotaReceta>
                </li>
              );
            })}
          </ul>
        </div>
    </PageShell>
  );
}
