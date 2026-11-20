import { and, desc, eq, ne } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { Countdown } from "@/components/countdown";
import { Hero } from "@/components/hero";
import { Button } from "@/components/ui/button";
import { MedicalFloaters } from "@/components/medico/floaters";
import { Corazon, Estetoscopio } from "@/components/medico/icons";
import { Counter } from "@/components/motion/counter";
import { EcgDivider } from "@/components/motion/ecg-divider";
import { DivisorClasico } from "@/components/clasico/ornamentos";
import { ScrollWords } from "@/components/motion/scroll-words";
import { count } from "drizzle-orm";
import { students as studentsTable } from "@/db/schema";
import { Polaroid } from "@/components/polaroid";
import { RevealGroup } from "@/components/reveal-group";
import { tiltFor } from "@/lib/tilt";
import { IntroBook } from "@/components/intro-book";
import { MemoryMedia } from "@/components/memory-media";
import { getSettings } from "@/lib/access";
import { isAdminRequest } from "@/lib/admin-session";
import { playlistEmbed } from "@/lib/playlist";
import { imageUrl } from "@/lib/image-sizes";
import { saveInlineText } from "@/app/admin/contenido/inline-actions";

export const dynamic = "force-dynamic";

// Si el admin no ha fijado la fecha, se usa el 5 de diciembre de 2026 a las 8:00 a. m. (Colombia).
const DEFAULT_CEREMONY = "2026-12-05T08:00:00-05:00";

const NAV = [
  { href: "/galeria", label: "Galería" },
  { href: "/mosaico", label: "Mosaico" },
  { href: "/firma", label: "La bata" },
  { href: "/mensajes", label: "Muro de recetas" },
  { href: "/linea", label: "Historia clínica" },
  { href: "/juramento", label: "Juramento" },
  { href: "/capsula", label: "Cápsula del tiempo" },
  { href: "/premios", label: "Premios" },
  { href: "/profesores", label: "Profesores" },
  { href: "/visitas", label: "Libro de visitas" },
  { href: "/libro", label: "Libro para imprimir" },
  { href: "/en-vivo", label: "Modo ceremonia" },
];

export default async function HomePage() {
  const [settings, editable, [{ total: nRecuerdos }], [{ total: nEstudiantes }]] = await Promise.all([
    getSettings(),
    isAdminRequest(),
    db.select({ total: count() }).from(memories).where(eq(memories.status, "approved")),
    db.select({ total: count() }).from(studentsTable),
  ]);
  const ceremonyIso = (settings.ceremonyAt ?? new Date(DEFAULT_CEREMONY)).toISOString();
  const title = settings.heroTitle ?? "Bata Blanca";
  const subtitle = settings.heroSubtitle ?? "Los recuerdos de la promoción";
  const embed = playlistEmbed(settings.playlistUrl);

  const items = await db
    .select({
      id: memories.id,
      type: memories.type,
      title: memories.title,
      body: memories.body,
      path: memories.imagekitFilePath,
      publicId: memories.cloudinaryPublicId,
      width: memories.width,
      height: memories.height,
      studentName: students.fullName,
      nickname: students.nickname,
    })
    .from(memories)
    .innerJoin(students, eq(students.id, memories.studentId))
    .where(and(eq(memories.status, "approved"), ne(memories.type, "signature"), ne(memories.type, "message")))
    .orderBy(desc(memories.createdAt))
    .limit(120);

  // Todas las fotos aprobadas: la intro y la portada las van rotando (se actualizan al recargar).
  const fotosAprobadas = items.filter((i) => i.type === "photo" && i.path);
  const fotosIntro = fotosAprobadas.map((i) => imageUrl(i.path!, "gallery"));

  // Polaroids de la portada, rotadas por Hero.
  const floaters = fotosAprobadas.map((p) => ({
    id: p.id,
    src: imageUrl(p.path!, "thumb"),
    rotate: tiltFor(p.id).rotate,
  }));

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-paper px-4 py-10">
      <IntroBook title={title} fotos={fotosIntro} />
      <MedicalFloaters />
      <div className="mx-auto max-w-5xl">
        {editable && (
          <p className="mb-4 rounded-lg border border-gold/50 bg-gold/10 px-3 py-2 text-center text-xs text-secondary">
            Modo edición: haz clic en el título o el subtítulo para cambiarlos. Se guardan al salir del campo.
          </p>
        )}
        <Hero
          title={title}
          subtitle={subtitle}
          editable={editable}
          saveTitle={saveInlineText.bind(null, "heroTitle")}
          saveSubtitle={saveInlineText.bind(null, "heroSubtitle")}
          photos={floaters}
        >
          <div className="flex flex-col items-center gap-8">
            <Countdown targetIso={ceremonyIso} />
            <div className="flex flex-wrap justify-center gap-4">
              <Button href="/subir">＋ Subir recuerdo</Button>
              <Button variant="secondary" href="#galeria">Ver los recuerdos</Button>
            </div>
          </div>
        </Hero>

        <section className="mx-auto mt-20 max-w-4xl text-center">
          <div className="grid grid-cols-3 gap-6">
            {[
              { n: Number(nRecuerdos), label: "recuerdos" },
              { n: Number(nEstudiantes), label: "compañeros" },
              { n: 5, label: "años" },
            ].map((c) => (
              <div key={c.label}>
                <p className="font-display text-5xl text-secondary sm:text-6xl">
                  <Counter to={c.n} />
                </p>
                <p className="mt-1 text-sm font-semibold text-muted">{c.label}</p>
              </div>
            ))}
          </div>
        </section>

        <EcgDivider className="mt-16" />

        <section className="relative mx-auto mt-10 max-w-2xl paper-card p-8">
          {/* Cinta washi arriba y cinta marcapáginas dorada abajo: como un libro de verdad. */}
          <span className="washi" aria-hidden="true" style={{ top: -12, left: -18, transform: "rotate(-8deg)" }} />
          <span
            aria-hidden="true"
            className="absolute -bottom-7 right-10 h-16 w-4 bg-gold shadow-[0_6px_10px_rgba(31,41,55,0.18)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]"
          />
          <div className="flex justify-center gap-3 text-primary"><Estetoscopio size={28} /><Corazon size={28} className="med-beat text-rose" /></div>
          <h2 className="page-title mt-2 text-center font-display text-3xl">Capítulos del libro</h2>
          <ol className="mt-6 space-y-3">
            {NAV.map((l, i) => (
              <li key={l.href} className="group flex items-baseline gap-3">
                <span className="font-sans text-xs font-semibold text-muted">{String(i + 1).padStart(2, "0")}</span>
                <Link href={l.href} className="font-display text-lg text-secondary transition group-hover:text-primary">
                  {l.label}
                </Link>
                <span className="mb-1 flex-1 border-b border-dotted border-muted/50 transition group-hover:border-primary" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </section>

        {/* Cita del juramento hipocrático en tipografía de inscripción */}
        <section className="mx-auto mt-20 max-w-2xl text-center">
          <DivisorClasico />
          <p className="mt-8 font-[family-name:var(--font-cinzel)] text-2xl leading-relaxed text-secondary sm:text-3xl">
            «Ante todo, no hacer daño.»
          </p>
          <p className="mt-3 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.25em] text-muted uppercase">Juramento hipocrático</p>
        </section>

        <section className="mx-auto mt-20 max-w-3xl text-center">
          <ScrollWords className="font-display text-3xl leading-relaxed sm:text-4xl" text="Cinco años de madrugadas, cafés y parciales… y hoy nos ponemos la bata." />
          <div className="mt-10">
            <Button variant="gold" href="/firma">✍️ Firmar la bata</Button>
          </div>
        </section>

        {embed && (
          <section className="mx-auto mt-12 max-w-2xl">
            <p className="mb-2 text-center font-hand text-2xl text-primary">Sonidos de la carrera</p>
            <iframe src={embed} title="Playlist de la promoción" className="h-40 w-full rounded-xl border-0" loading="lazy" allow="encrypted-media" />
          </section>
        )}

        <div id="galeria" className="scroll-mt-8" />
        {items.length === 0 ? (
          <p className="mt-16 text-center text-muted">Aún no hay recuerdos aprobados. ¿Tienes alguno? 📸</p>
        ) : (
          <RevealGroup className="mt-14 columns-1 gap-8 sm:columns-2 lg:columns-3">
            {items.map((it) => (
              <div key={it.id} data-reveal className="mb-10 break-inside-avoid">
                <Polaroid
                  id={it.id}
                  caption={
                    <>
                      {it.studentName}
                      {it.nickname ? <span className="text-muted"> · {it.nickname}</span> : null}
                      {it.title ? <span className="block font-display text-base text-secondary">{it.title}</span> : null}
                    </>
                  }
                >
                  <MemoryMedia type={it.type} path={it.path} publicId={it.publicId} width={it.width} height={it.height} alt={it.title ?? `Recuerdo de ${it.studentName}`} />
                </Polaroid>
              </div>
            ))}
          </RevealGroup>
        )}
      </div>
    </main>
  );
}
