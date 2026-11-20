import { asc } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { db } from "@/db";
import { students } from "@/db/schema";
import { SignForm } from "./sign-form";

export const revalidate = 10;

export default async function FirmarPage() {
  const list = await db
    .select({ id: students.id, fullName: students.fullName, nickname: students.nickname })
    .from(students)
    .orderBy(asc(students.orderIndex), asc(students.fullName));

  return (
    <PageShell eyebrow="Tradición de la promoción" title="Firma la bata" lede="Firma con el dedo o el mouse. Tu firma aparecerá sobre la bata." width="max-w-md">
        <div className="paper-card p-5">
          <SignForm students={list} />
        </div>
    </PageShell>
  );
}
