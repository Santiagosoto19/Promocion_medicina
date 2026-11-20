import { and, desc, eq } from "drizzle-orm";
import { MedicalFloaters } from "@/components/medico/floaters";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { Polaroid } from "@/components/polaroid";
import { RevealGroup } from "@/components/reveal-group";
import { imageUrl } from "@/lib/image-sizes";

export const dynamic = "force-dynamic";

const pill = (active: boolean) =>
  `rounded-full border px-4 py-2.5 text-sm transition hover:-translate-y-0.5 ${active ? "border-primary bg-primary/10 text-[#0B6870]" : "border-line bg-white text-text"}`;

// Mosaico de la promoción. Usa siempre la miniatura (thumb): nunca el original.
export default async function MosaicoPage({ searchParams }: { searchParams: Promise<{ modo?: string }> }) {
  const { modo } = await searchParams;
  const mode = modo === "masonry" ? "masonry" : "cuadricula";

  const rows = await db
    .select({
      id: memories.id,
      path: memories.imagekitFilePath,
      studentName: students.fullName,
      nickname: students.nickname,
      title: memories.title,
    })
    .from(memories)
    .innerJoin(students, eq(students.id, memories.studentId))
    .where(and(eq(memories.status, "approved"), eq(memories.type, "photo")))
    .orderBy(desc(memories.createdAt))
    .limit(400);

  const caption = (r: (typeof rows)[number]) => (
    <>
      {r.studentName}
      {r.nickname ? <span className="text-muted"> · {r.nickname}</span> : null}
    </>
  );

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-paper px-4 py-10">
      <MedicalFloaters />
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mt-2 page-title font-display text-5xl">Mosaico</h1>
            <p className="mt-2 text-muted">{rows.length} fotos de la promoción</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link href="/mosaico" className={pill(mode === "cuadricula")}>Cuadrícula</Link>
            <Link href="/mosaico?modo=masonry" className={pill(mode === "masonry")}>Masonry</Link>
            <Link href="/mosaico/fotomosaico" className={pill(false)}>Fotomosaico</Link>
          </nav>
        </header>

        {rows.length === 0 ? (
          <p className="py-16 text-center text-muted">Todavía no hay fotos aprobadas. 📸</p>
        ) : mode === "cuadricula" ? (
          <RevealGroup className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((r, i) => (
              <div key={r.id} data-reveal>
                <Polaroid id={r.id} caption={caption(r)} tape={i % 3 === 0}>
                  <div className="relative aspect-square overflow-hidden">
                    {r.path && (
                      <Image
                        src={imageUrl(r.path, "thumb")}
                        alt={r.title ?? `Foto de ${r.studentName}`}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        unoptimized
                        priority={i < 6}
                        className="object-cover grayscale transition duration-700 hover:grayscale-0"
                      />
                    )}
                  </div>
                </Polaroid>
              </div>
            ))}
          </RevealGroup>
        ) : (
          <RevealGroup className="mt-12 columns-1 gap-8 sm:columns-2 lg:columns-3">
            {rows.map((r, i) => (
              <div key={r.id} data-reveal className="mb-10 break-inside-avoid">
                <Polaroid id={r.id} caption={caption(r)} tape={i % 2 === 0}>
                  {r.path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(r.path, "thumb")} alt={r.title ?? `Foto de ${r.studentName}`} loading="lazy" className="h-auto w-full grayscale transition duration-700 hover:grayscale-0" />
                  )}
                </Polaroid>
              </div>
            ))}
          </RevealGroup>
        )}
      </div>
    </main>
  );
}
