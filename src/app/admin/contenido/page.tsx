import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { requireAdmin } from "@/lib/admin-session";
import { saveContent } from "./actions";
import { ContentForm } from "./content-form";

export default async function ContenidoAdmin() {
  await requireAdmin();
  const settings = await getSettings();
  const photos = await db
    .select({ path: memories.imagekitFilePath, studentName: students.fullName })
    .from(memories)
    .innerJoin(students, eq(students.id, memories.studentId))
    .where(eq(memories.status, "approved"))
    .orderBy(desc(memories.createdAt))
    .limit(200);

  const toLocal = (d: Date | null) => (d ? new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 16) : "");

  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
        <h1 className="page-title font-display text-3xl">Contenido de la portada</h1>
        <ContentForm
          action={saveContent}
          initial={{
            heroTitle: settings.heroTitle ?? "",
            heroSubtitle: settings.heroSubtitle ?? "",
            playlistUrl: settings.playlistUrl ?? "",
            guestsEnabled: settings.guestsEnabled,
            capsuleOpenAt: toLocal(settings.capsuleOpenAt),
            mosaicTargetPath: settings.mosaicTargetPath ?? "",
          }}
          photos={photos.filter((p) => p.path).map((p) => ({ path: p.path!, label: p.studentName }))}
        />
      </div>
    </main>
  );
}
