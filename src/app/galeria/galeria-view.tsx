"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import { useLayoutEffect, useRef, useState } from "react";
import { Polaroid } from "@/components/polaroid";

gsap.registerPlugin(ScrollTrigger);
import { MemoryMedia } from "@/components/memory-media";
import { audioSrc, videoPoster, videoSrc } from "@/lib/cloudinary-url";
import { imageUrl } from "@/lib/image-sizes";
import { toggleReaction } from "./actions";
import { REACTION_EMOJIS } from "@/lib/reactions";
import { CompartirBoton } from "@/components/compartir-boton";

export type GaleriaItem = {
  id: string;
  type: "photo" | "video" | "audio" | "message" | "signature";
  title: string | null;
  body: string | null;
  path: string | null;
  publicId: string | null;
  width: number | null;
  height: number | null;
  studentId: string;
  studentName: string;
  nickname: string | null;
  counts: Record<string, number>;
};

const MINE_KEY = "bb:reacciones";
const DEVICE_KEY = "bb:dispositivo";

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "sin-almacenamiento";
  }
}

function readMine(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeMine(value: Record<string, string[]>) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(value));
  } catch {
    // Sin almacenamiento local, la reacción igual se guarda en el servidor.
  }
}

function Reactions({ item }: { item: GaleriaItem }) {
  const [parts, setParts] = useState<{ id: number; emoji: string; x: number; px: number; py: number }[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>(item.counts);
  const [mine, setMine] = useState<string[]>(() => (typeof window !== "undefined" ? readMine()[item.id] ?? [] : []));
  const [busy, setBusy] = useState(false);

  async function react(emoji: (typeof REACTION_EMOJIS)[number]) {
    if (busy) return;
    setBusy(true);
    const result = await toggleReaction({ memoryId: item.id, emoji, deviceId: getDeviceId() });
    setBusy(false);
    if (!result.ok) return;
    setCounts((c) => ({ ...c, [emoji]: result.count }));
    if (result.active && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Partículas: 6 emojis que suben y se desvanecen desde el botón.
      const batch = Array.from({ length: 6 }, (_, k) => ({
        id: Date.now() + k + Math.random(),
        emoji,
        x: 10 + Math.random() * 40,
        px: (Math.random() - 0.5) * 80,
        py: -(50 + Math.random() * 60),
      }));
      setParts((p) => [...p, ...batch]);
      setTimeout(() => setParts((p) => p.filter((x) => !batch.some((b) => b.id === x.id))), 1200);
    }
    const next = result.active ? [...mine, emoji] : mine.filter((e) => e !== emoji);
    setMine(next);
    const all = readMine();
    all[item.id] = next;
    writeMine(all);
    if ("vibrate" in navigator) navigator.vibrate?.(10);
  }

  return (
    <div className="relative flex flex-wrap gap-1.5">
      {parts.map((p) => (
        <span
          key={p.id}
          className="particle absolute bottom-6 text-lg"
          style={{ left: `${p.x}%`, ["--px" as string]: `${p.px}px`, ["--py" as string]: `${p.py}px` }}
          aria-hidden="true"
        >
          {p.emoji}
        </span>
      ))}
      {REACTION_EMOJIS.map((emoji) => {
        const active = mine.includes(emoji);
        return (
          <button
            key={emoji}
            type="button"
            aria-pressed={active}
            onClick={() => void react(emoji)}
            disabled={busy}
            className={`rounded-full border px-2.5 py-1 text-sm transition ${active ? "border-primary bg-primary/10" : "border-line hover:bg-paper"}`}
          >
            {emoji} <span className="text-muted">{counts[emoji] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

const SPEEDS = [0.06, -0.03, 0.1];

export function GaleriaView({ items }: { items: GaleriaItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // Solo fotos y videos entran al visor; las notas de voz se escuchan en su tarjeta.
  const viewable = items.filter((i) => (i.type === "photo" && i.path) || (i.type === "video" && i.publicId));
  const slides = viewable.map((it) =>
    it.type === "video"
      ? {
          type: "video" as const,
          sources: [{ src: videoSrc(it.publicId!), type: "video/mp4" }],
          poster: videoPoster(it.publicId!),
          title: it.title ?? `Video de ${it.studentName}`,
        }
      : {
          src: imageUrl(it.path!, "lightbox"),
          alt: it.title ?? `Recuerdo de ${it.studentName}`,
          width: it.width ?? 1920,
          height: it.height ?? 1080,
          title: it.title ?? undefined,
        },
  );

  // Tres columnas, cada una con su propia velocidad de scroll (parallax suave).
  const columns: GaleriaItem[][] = [[], [], []];
  items.forEach((it, i) => columns[i % 3].push(it));

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-col]").forEach((col, i) => {
        gsap.to(col, {
          yPercent: -SPEEDS[i] * 100,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
      gsap.from("[data-reveal]", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.05,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [items.length]);

  const renderCard = (it: GaleriaItem) => {
    const viewIndex = viewable.findIndex((v) => v.id === it.id);
    const caption = (
      <>
        {it.studentName}
        {it.nickname ? <span className="text-muted"> · {it.nickname}</span> : null}
      </>
    );
    return (
      <div key={it.id} id={`recuerdo-${it.id}`} data-reveal className="mb-10 scroll-mt-24">
        {it.type === "photo" && it.path ? (
          <button type="button" onClick={() => setIndex(viewIndex)} className="block w-full text-left" aria-label="Ver foto">
            <Polaroid id={it.id} caption={caption}>
              <MemoryMedia type="photo" path={it.path} publicId={null} width={it.width} height={it.height} alt={it.title ?? `Recuerdo de ${it.studentName}`} />
            </Polaroid>
          </button>
        ) : it.type === "video" && it.publicId ? (
          <button type="button" onClick={() => setIndex(viewIndex)} className="block w-full text-left" aria-label="Reproducir video">
            <Polaroid id={it.id} caption={caption}>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={videoPoster(it.publicId)} alt="" loading="lazy" decoding="async" className="h-auto w-full" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-black/55 px-4 py-2 text-lg text-white">▶</span>
                </span>
              </div>
            </Polaroid>
          </button>
        ) : it.type === "audio" && it.publicId ? (
          <Polaroid id={it.id} caption={<span className="font-hand text-xl text-primary">Nota de voz · {it.studentName}</span>}>
            <audio src={audioSrc(it.publicId)} controls preload="none" className="w-full" />
          </Polaroid>
        ) : null}

        <div className="mt-4 space-y-2 px-1">
          {it.title && <p className="font-display text-xl text-secondary">{it.title}</p>}
          {it.body && <p className="text-sm text-muted">{it.body}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Reactions item={it} />
            <CompartirBoton ruta={`/galeria#recuerdo-${it.id}`} titulo={it.title ?? `Recuerdo de ${it.studentName}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div ref={wrap} className="grid grid-cols-1 items-start gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((col, c) => (
          <div key={c} data-col className={c === 1 ? "sm:mt-16" : ""}>
            {col.map(renderCard)}
          </div>
        ))}
      </div>

      <Lightbox
        open={index !== null}
        index={index ?? 0}
        close={() => setIndex(null)}
        slides={slides}
        plugins={[Video]}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
}
