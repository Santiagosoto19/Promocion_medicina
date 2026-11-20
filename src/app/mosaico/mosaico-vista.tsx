"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Polaroid } from "@/components/polaroid";
import { RevealGroup } from "@/components/reveal-group";
import { imageUrl } from "@/lib/image-sizes";

export type FotoMosaico = {
  id: string;
  path: string | null;
  studentName: string;
  nickname: string | null;
  title: string | null;
};

const pill = (active: boolean) =>
  `rounded-full border px-4 py-2.5 text-sm transition hover:-translate-y-0.5 ${active ? "border-primary bg-primary/10 text-[#0B6870]" : "border-line bg-white text-text"}`;

// Cambia entre cuadrícula y masonry en el navegador: sin recargar la página.
export function MosaicoVista({ rows }: { rows: FotoMosaico[] }) {
  const [modo, setModo] = useState<"cuadricula" | "masonry">("cuadricula");

  const caption = (r: FotoMosaico) => (
    <>
      {r.studentName}
      {r.nickname ? <span className="text-muted"> · {r.nickname}</span> : null}
    </>
  );

  return (
    <>
      <nav className="flex flex-wrap gap-2" aria-label="Vista del mosaico">
        <button type="button" aria-pressed={modo === "cuadricula"} onClick={() => setModo("cuadricula")} className={pill(modo === "cuadricula")}>Cuadrícula</button>
        <button type="button" aria-pressed={modo === "masonry"} onClick={() => setModo("masonry")} className={pill(modo === "masonry")}>Masonry</button>
        <Link href="/mosaico/fotomosaico" className={pill(false)}>Fotomosaico</Link>
      </nav>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-muted">Todavía no hay fotos aprobadas. 📸</p>
      ) : modo === "cuadricula" ? (
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
    </>
  );
}
