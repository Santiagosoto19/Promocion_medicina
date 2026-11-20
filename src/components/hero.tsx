"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { InlineEdit } from "@/components/inline-edit";
import { Columna, Fronton, Laurel } from "@/components/clasico/ornamentos";
import { useEsAdmin } from "@/lib/use-es-admin";

gsap.registerPlugin(ScrollTrigger);

type Photo = { id: string; src: string; rotate: number };

// Cada cuántos ms cambia la rotación de fotos en la portada.
const INTERVALO_FOTOS = 3500;

// Portada como una página abierta de libro: a la izquierda el título y la cuenta regresiva,
// a la derecha las fotos sobre el papel. El lomo va en el centro. Si el admin edita, el título es editable.
export function Hero({
  title,
  subtitle,
  saveTitle,
  saveSubtitle,
  photos,
  children,
}: {
  title: string;
  subtitle: string;
  saveTitle: (value: string) => Promise<{ ok: boolean; error?: string }>;
  saveSubtitle: (value: string) => Promise<{ ok: boolean; error?: string }>;
  photos: Photo[];
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  // Edición solo para el admin con sesión: se decide en el navegador, así la portada puede guardarse en caché.
  const editable = useEsAdmin();
  // Índice de la primera foto visible; avanza solo y muestra todas las aprobadas, en turnos.
  const [inicio, setInicio] = useState(0);

  useEffect(() => {
    if (photos.length <= 3) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setInicio((i) => (i + 1) % photos.length), INTERVALO_FOTOS);
    return () => clearInterval(t);
  }, [photos.length]);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.from("[data-fade]", { opacity: 0, y: 16, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.8 });
        gsap.from("[data-float]", { opacity: 0, scale: 0.9, duration: 1.1, ease: "back.out(1.3)", stagger: 0.15, delay: 0.5 });
        // Las páginas se mueven un poco distinto al hacer scroll.
        gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
          const speed = Number(el.dataset.speed ?? 0);
          gsap.to(el, {
            yPercent: -speed * 30,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
          });
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  // Posiciones fijas sobre la página derecha: tres fotos como en un álbum.
  const lugares = [
    "left-[6%] top-[8%] w-[46%] sm:w-[44%]",
    "right-[4%] top-[34%] w-[42%] sm:w-[40%]",
    "left-[18%] bottom-[6%] w-[40%] sm:w-[38%]",
  ];
  // Con más de tres fotos, las tres posiciones toman turnos sobre todas las aprobadas.
  const visibles = photos.length <= 3
    ? photos.slice(0, 3)
    : [0, 1, 2].map((k) => photos[(inicio + k) % photos.length]);

  return (
    <section ref={ref} className="relative isolate pt-4 pb-16">
      <div data-speed="0.2" className="glow-teal pointer-events-none absolute -top-24 left-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full" aria-hidden="true" />

      {/* Columnas jónicas a los lados del libro (solo pantallas grandes) */}
      <Columna className="columna-clasica pointer-events-none absolute -left-4 top-10 -z-10 hidden xl:block" alto={500} />
      <Columna className="columna-clasica pointer-events-none absolute -right-4 top-10 -z-10 hidden xl:block" alto={500} />
      {/* Frontón griego que remata el libro */}
      <Fronton className="mx-auto mb-1 hidden h-12 w-56 text-[#c9a55c] sm:block" />
      <div data-speed="0.4" className="relative mx-auto grid max-w-4xl overflow-hidden rounded-[6px] bg-white shadow-[0_1px_2px_rgba(15,42,58,0.06),0_16px_40px_rgba(15,42,58,0.10),0_40px_90px_rgba(15,42,58,0.14)] sm:grid-cols-2">
        {/* Lomo del libro */}
        <span className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden w-12 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/10 to-transparent sm:block" aria-hidden="true" />

        {/* Página izquierda: texto y cuenta regresiva */}
        <div className="flex flex-col items-center justify-center gap-6 p-7 text-center sm:p-12">
          <p data-fade className="font-hand text-xl text-muted">Promoción de Medicina, Universidad de Sucre</p>
          {/* Coronas de laurel a ambos lados del nombre de la promoción (en escritorio) */}
          <div data-fade className="relative w-full">
            <Laurel className="pointer-events-none absolute -left-3 top-1/2 hidden h-20 w-7 -translate-y-1/2 text-[#c9a55c] sm:block" />
            <div className="min-w-0">
            {editable ? (
              <InlineEdit as="h1" className="gold-shine font-display text-5xl leading-[1.02] sm:text-6xl" value={title} editable onSave={saveTitle} />
            ) : (
              <h1 className="gold-shine font-display text-5xl leading-[1.02] sm:text-6xl">{title}</h1>
            )}
            </div>
            <Laurel espejo className="pointer-events-none absolute -right-3 top-1/2 hidden h-20 w-7 -translate-y-1/2 text-[#c9a55c] sm:block" />
          </div>
          {/* Trazo de tinta dorada que se dibuja bajo el título, como una firma. */}
          <svg data-fade viewBox="0 0 320 14" preserveAspectRatio="none" className="-mt-3 h-3 w-40 overflow-visible sm:w-56" aria-hidden="true">
            <path
              d="M4 9 C 70 2, 150 13, 240 6 S 310 4, 316 8"
              fill="none"
              stroke="var(--bb-gold)"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength="1"
              style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "bb-draw 1.4s 1.1s cubic-bezier(.4,0,.2,1) forwards" }}
            />
          </svg>
          <div data-fade>
            <InlineEdit className="font-hand text-2xl text-primary sm:text-3xl" value={subtitle} editable={editable} onSave={saveSubtitle} />
          </div>
          <div data-fade className="w-full">
            {children}
          </div>
        </div>

        {/* Página derecha: fotos sobre el papel */}
        <div className="relative min-h-[320px] border-t border-line bg-[#FBFCFD] sm:min-h-[460px] sm:border-t-0 sm:border-l">
          {photos.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-10 text-center">
              <p className="font-hand text-2xl text-muted">Aquí irán las primeras fotos de la promoción</p>
            </div>
          ) : (
            [0, 1, 2].map((i) => {
              const p = visibles[i];
              // Huecos sin foto: polaroid vacía con invitación, como manda la guía visual del proyecto.
              if (!p) {
                return (
                  <div key={`vacia-${i}`} data-float className={`polaroid absolute bg-white p-2 pb-7 ${lugares[i]}`} style={{ ["--rot" as string]: `${i === 1 ? 3 : -3}deg` }}>
                    <div className="flex aspect-square items-center justify-center bg-[#F4F7F8] p-4 text-center font-hand text-xl text-[#4B5563]">Tu foto aquí 📸</div>
                  </div>
                );
              }
              return (
                <div
                  key={`${i}-${p.id}`}
                  data-float
                  className={`polaroid absolute bg-white p-2 pb-7 ${lugares[i]}`}
                  style={{ ["--rot" as string]: `${p.rotate}deg`, animation: "fadeIn 0.8s ease both" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt="" className="h-auto w-full" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
