// Firmas como trazos normalizados (0–1000). Se guardan como JSON, nunca como HTML ni imagen.
export type Point = [number, number];
export type Strokes = Point[][];

export const MAX_STROKES = 200;
export const MAX_POINTS_PER_STROKE = 500;

export function parseStrokes(raw: string | null | undefined): Strokes | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { v?: number; strokes?: unknown };
    if (!Array.isArray(data.strokes)) return null;
    const strokes: Strokes = [];
    for (const s of data.strokes.slice(0, MAX_STROKES)) {
      if (!Array.isArray(s)) continue;
      const pts: Point[] = [];
      for (const p of s.slice(0, MAX_POINTS_PER_STROKE)) {
        if (Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "number") {
          pts.push([Math.min(1000, Math.max(0, p[0])), Math.min(1000, Math.max(0, p[1]))]);
        }
      }
      if (pts.length > 0) strokes.push(pts);
    }
    return strokes.length ? strokes : null;
  } catch {
    return null;
  }
}

// Convierte los trazos normalizados (0–1000 × 0–1000, canvas 2:1) al marco de 300×120 de BataFirmas.
export function strokesToPath(raw: string | null | undefined): string | undefined {
  const strokes = parseStrokes(raw);
  if (!strokes) return undefined;
  return strokes
    .map((pts) =>
      pts
        .map(([x, y], i) => `${i === 0 ? "M" : "L"}${(x * 0.3).toFixed(1)} ${(y * 0.12).toFixed(1)}`)
        .join(" "),
    )
    .join(" ");
}
