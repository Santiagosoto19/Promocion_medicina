"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

type LiveItem = {
  id: string;
  kind: "photo" | "video";
  src: string;
  poster: string | null;
  title: string | null;
  studentName: string;
  nickname: string | null;
};

type LiveData = {
  items: LiveItem[];
  call: { fullName: string; nickname: string | null; quote: string | null } | null;
};

const POLL_MS = 4000;
const SLIDE_MS = 6000;

export function LiveView({ siteUrl }: { siteUrl: string }) {
  const [data, setData] = useState<LiveData>({ items: [], call: null });
  const [index, setIndex] = useState(0);

  // Consulta cada 4 segundos. Si falla la red, se conserva lo último que se mostró.
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        if (res.ok && alive) setData(await res.json());
      } catch {
        // Sin red: se queda con los datos anteriores.
      }
    }
    void load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Cambia de recuerdo cada 6 segundos.
  useEffect(() => {
    if (data.items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % data.items.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [data.items.length]);

  const current = data.items.length ? data.items[index % data.items.length] : null;
  const subirUrl = `${siteUrl.replace(/\/$/, "")}/subir`;

  if (data.call) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
        <svg viewBox="0 0 400 60" className="w-80 max-w-full" aria-hidden="true" focusable="false">
          <path
            d="M0 30 H120 L140 30 L152 6 L168 54 L182 18 L194 30 H400"
            fill="none"
            stroke="var(--bb-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          />
        </svg>
        <p className="mt-8 font-hand text-3xl text-primary">Llamado a lista</p>
        <h1 className="mt-4 font-display text-6xl text-secondary sm:text-8xl">{data.call.fullName}</h1>
        {data.call.nickname && <p className="mt-4 font-display text-3xl text-gold">“{data.call.nickname}”</p>}
        {data.call.quote && <p className="mt-6 max-w-2xl text-2xl text-muted">{data.call.quote}</p>}
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col bg-paper">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
        {current ? (
          <figure key={current.id} className="animate-[fadeIn_0.8s_ease-out] text-center">
            {current.kind === "video" ? (
              <video
                src={current.src}
                poster={current.poster ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                className="max-h-[80dvh] w-auto max-w-full rounded-2xl shadow-lg"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.src} alt={current.title ?? `Recuerdo de ${current.studentName}`} className="max-h-[80dvh] w-auto max-w-full rounded-2xl shadow-lg" />
            )}
            <figcaption className="mt-4 text-2xl text-secondary">
              {current.studentName}
              {current.nickname ? <span className="text-muted"> · {current.nickname}</span> : null}
              {current.title ? <span className="block font-display text-3xl">{current.title}</span> : null}
            </figcaption>
          </figure>
        ) : (
          <p className="font-hand text-4xl text-primary">Las fotos y videos aparecerán aquí 📸</p>
        )}
      </div>

      <div className="absolute right-4 bottom-4 flex items-center gap-3 paper-card/90 p-3 shadow">
        <QRCodeSVG value={subirUrl || "/subir"} size={112} level="M" title="Código QR para subir recuerdos" />
        <p className="max-w-[9rem] text-sm text-secondary">Escanea y sube tu foto o video</p>
      </div>
    </main>
  );
}
