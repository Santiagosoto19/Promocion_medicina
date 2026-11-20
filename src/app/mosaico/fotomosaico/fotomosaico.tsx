"use client";

import { useEffect, useState } from "react";

type Tile = { id: string; url: string };
const COLS = 40;
const ROWS = 30;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img"));
    img.src = url;
  });
}

// Color promedio de una imagen: el navegador la reduce a 1 píxel.
function averageColor(img: HTMLImageElement): [number, number, number] {
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("ctx");
  ctx.drawImage(img, 0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

export function Fotomosaico({ target, tiles }: { target: string | null; tiles: Tile[] }) {
  const [picks, setPicks] = useState<string[] | null>(null);
  const [status, setStatus] = useState<string>("");
  const [showTarget, setShowTarget] = useState(false);

  useEffect(() => {
    if (!target || tiles.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        setStatus("Preparando las miniaturas…");
        const tileColors: { url: string; rgb: [number, number, number] }[] = [];
        const settled = await Promise.allSettled(tiles.map((t) => loadImage(t.url)));
        settled.forEach((r, i) => {
          if (r.status === "fulfilled") tileColors.push({ url: tiles[i].url, rgb: averageColor(r.value) });
        });
        if (tileColors.length === 0) throw new Error("tiles");

        setStatus("Leyendo la foto objetivo…");
        const targetImg = await loadImage(target);
        const canvas = document.createElement("canvas");
        canvas.width = COLS;
        canvas.height = ROWS;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("ctx");
        ctx.drawImage(targetImg, 0, 0, COLS, ROWS);
        const data = ctx.getImageData(0, 0, COLS, ROWS).data;

        const chosen: string[] = [];
        for (let i = 0; i < COLS * ROWS; i++) {
          const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
          let best = tileColors[0];
          let bestDist = Infinity;
          for (const t of tileColors) {
            const dr = t.rgb[0] - r, dg = t.rgb[1] - g, db = t.rgb[2] - b;
            const dist = dr * dr + dg * dg + db * db;
            if (dist < bestDist) {
              bestDist = dist;
              best = t;
            }
          }
          chosen.push(best.url);
        }
        if (!cancelled) {
          setPicks(chosen);
          setStatus("");
        }
      } catch {
        if (!cancelled) setStatus("No pudimos armar el fotomosaico en este navegador. Revisa en ImageKit que se permita leer las imágenes desde tu sitio (CORS).");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target, tiles]);

  if (!target) return <p className="text-muted">El admin todavía no eligió la foto objetivo (en Contenido de la portada).</p>;
  if (tiles.length < 10) return <p className="text-muted">Hacen falta al menos 10 fotos aprobadas para armar el fotomosaico.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{status}</p>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={showTarget} onChange={(e) => setShowTarget(e.target.checked)} className="accent-primary" />
          Mostrar la foto objetivo
        </label>
      </div>
      <div className="relative">
        {showTarget && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={target} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        {picks && (
          <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
            {picks.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
