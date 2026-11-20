// Giro estable por recuerdo (−4° a 4°) y lado de la cinta. Depende del id, así no cambia entre visitas.
export function tiltFor(id: string): { rotate: number; tapeLeft: boolean } {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { rotate: ((h % 17) - 8) / 2, tapeLeft: (h >>> 5) % 2 === 0 };
}
