import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { awardVotes, awards, students } from "@/db/schema";
import { PageShell } from "@/components/page-shell";
import { PrizesView } from "./prizes-view";

export const dynamic = "force-dynamic";

export default async function PremiosPage() {
  const [allAwards, list, tally] = await Promise.all([
    db.select().from(awards).orderBy(asc(awards.orderIndex), asc(awards.createdAt)),
    db.select({ id: students.id, fullName: students.fullName, nickname: students.nickname }).from(students).orderBy(asc(students.fullName)),
    db
      .select({ awardId: awardVotes.awardId, nomineeId: awardVotes.nomineeStudentId, total: sql<number>`count(*)::int` })
      .from(awardVotes)
      .groupBy(awardVotes.awardId, awardVotes.nomineeStudentId),
  ]);

  // Solo se calcula el ganador de las categorías reveladas; el resto no muestra resultados.
  const names = new Map(list.map((s) => [s.id, s.fullName]));
  const results = allAwards.map((a) => {
    const votes = tally.filter((t) => t.awardId === a.id).sort((x, y) => y.total - x.total);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status,
      winner: a.status === "revealed" && votes[0] ? { name: names.get(votes[0].nomineeId) ?? "—", total: votes[0].total } : null,
    };
  });

  return (
    <PageShell eyebrow="Ceremonia" title="Premios de la promoción" lede="Vota una vez por categoría. Los resultados se revelan en la ceremonia." width="max-w-3xl">
      <PrizesView awards={results} students={list} />
    </PageShell>
  );
}
