import { asc } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { db } from "@/db";
import { students } from "@/db/schema";
import { SubirForm } from "./subir-form";

export const dynamic = "force-dynamic";

export default async function SubirPage() {
  const list = await db
    .select({ id: students.id, fullName: students.fullName, nickname: students.nickname })
    .from(students)
    .orderBy(asc(students.orderIndex), asc(students.fullName));

  return (
    <PageShell eyebrow="Promoción Medicina, 2026" title="Sube tu recuerdo" lede="Elige tu nombre, sube tus fotos o videos. El admin los revisa antes de publicarlos." width="max-w-2xl">
        <div>
          <SubirForm students={list} />
        </div>
    </PageShell>
  );
}
