import { parseStrokes } from "@/lib/strokes";

// Dibuja la firma como SVG a partir de trazos guardados. No se inyecta HTML del usuario.
export function SignatureStrokes({ data, className, color = "#1E3A8A" }: { data: string | null; className?: string; color?: string }) {
  const strokes = parseStrokes(data);
  if (!strokes) return null;
  return (
    <svg viewBox="0 0 1000 1000" className={className} role="img" aria-label="Firma">
      {strokes.map((pts, i) => (
        <polyline
          key={i}
          points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
