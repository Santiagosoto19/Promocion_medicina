import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-session";
import { deleteStudent, updateStudent } from "../actions";
import { DeleteStudentButton, StudentForm } from "../student-form";

export default async function EditarEstudiante({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [student] = await db.select().from(students).where(eq(students.id, id)).limit(1);
  if (!student) notFound();

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(memories)
    .where(eq(memories.studentId, id));

  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-xl space-y-8">
        <header>
          <Link href="/admin/promocion" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Promoción</Link>
          <h1 className="mt-2 page-title font-display text-3xl">{student.fullName}</h1>
        </header>

        <div className="paper-card p-5">
          <StudentForm
            action={updateStudent.bind(null, id)}
            defaults={student}
            submitLabel="Guardar cambios"
          />
        </div>

        <div className="paper-card p-5">
          <h2 className="font-display text-lg text-secondary">Quitar de la lista</h2>
          <p className="mt-1 text-sm text-muted">
            {total > 0
              ? `Tiene ${total} ${total === 1 ? "recuerdo" : "recuerdos"}, así que no se puede quitar. Sus recuerdos quedan protegidos.`
              : "No tiene recuerdos. Puede quitarse de la lista."}
          </p>
          {total === 0 && (
            <div className="mt-4">
              <DeleteStudentButton remove={() => deleteStudent(id)} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
