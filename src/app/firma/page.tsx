import { desc, eq } from "drizzle-orm";
import { MedicalFloaters } from "@/components/medico/floaters";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { strokesToPath } from "@/lib/strokes";
import { FirmaClient } from "./firma-client";

export const revalidate = 10;

// La bata con las firmas aprobadas. Cada firma se dibuja con sus trazos reales.
export default async function FirmaPage() {
  const rows = await db
    .select({
      id: memories.id,
      body: memories.body,
      phrase: memories.title,
      createdAt: memories.createdAt,
      studentName: students.fullName,
    })
    .from(memories)
    .innerJoin(students, eq(students.id, memories.studentId))
    .where(eq(memories.status, "approved"))
    .orderBy(desc(memories.createdAt))
    .limit(400);

  const firmas = rows
    .filter((r) => r.body)
    .map((r) => ({
      id: r.id,
      nombre: r.studentName,
      mensaje: r.phrase ?? undefined,
      trazo: strokesToPath(r.body),
      fecha: r.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" }),
    }))
    .filter((f) => f.trazo);

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-paper">
      <MedicalFloaters />
      <div className="px-4 pt-6">
      </div>
      <FirmaClient firmas={firmas} />
    </main>
  );
}
