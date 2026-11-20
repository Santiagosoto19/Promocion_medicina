import { and, desc, eq } from "drizzle-orm";
import { MedicalFloaters } from "@/components/medico/floaters";
import Link from "next/link";
import { db } from "@/db";
import { memories } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { imageUrl } from "@/lib/image-sizes";
import { Fotomosaico } from "./fotomosaico";

export const dynamic = "force-dynamic";

export default async function FotomosaicoPage() {
  const settings = await getSettings();
  const target = settings.mosaicTargetPath ? imageUrl(settings.mosaicTargetPath, "gallery") : null;

  const rows = await db
    .select({ id: memories.id, path: memories.imagekitFilePath })
    .from(memories)
    .where(and(eq(memories.status, "approved"), eq(memories.type, "photo")))
    .orderBy(desc(memories.createdAt))
    .limit(300);
  const tiles = rows.filter((r) => r.path).map((r) => ({ id: r.id, url: imageUrl(r.path!, "thumb") }));

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-paper px-4 py-10">
      <MedicalFloaters />
      <div className="mx-auto max-w-5xl">
        <Link href="/mosaico" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Mosaico</Link>
        <h1 className="mt-2 page-title font-display text-4xl">Fotomosaico</h1>
        <p className="mt-2 text-muted">Vistas de lejos forman la foto de la promoción. Acércate para ver cada recuerdo.</p>
        <div className="mt-8">
          <Fotomosaico target={target} tiles={tiles} />
        </div>
      </div>
    </main>
  );
}
