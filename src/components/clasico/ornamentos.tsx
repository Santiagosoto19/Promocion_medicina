// Ornamentos clásicos en SVG lineal (sin imágenes). Usan currentColor y trazos finos.
// Los trazos con clase "trazo" se "dibujan" al entrar en pantalla (animación bb-draw, ver globals.css).

type Props = { className?: string; ancho?: number };

// Columna jónica con volutas. Decorativa: se oculta en móvil desde el contenedor.
export function Columna({ className = "", alto = 300 }: { className?: string; alto?: number }) {
  const estrias = [18, 24, 30, 36, 42].map((x) => `M${x} 40 V268`).join(" ");
  return (
    <svg viewBox="0 0 60 300" height={alto} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path className="trazo" pathLength={1} d="M6 0 H54 V10 H6 Z" />
      <path className="trazo" pathLength={1} d="M10 10 C 2 10, 2 26, 12 26 C 20 26, 18 16, 14 18" />
      <path className="trazo" pathLength={1} d="M50 10 C 58 10, 58 26, 48 26 C 40 26, 42 16, 46 18" />
      <path className="trazo" pathLength={1} d="M12 10 H48 V34 H12 Z" />
      <path className="trazo" pathLength={1} d="M14 36 V268 M46 36 V268" />
      <path className="trazo" pathLength={1} d={estrias} strokeWidth="0.6" />
      <path className="trazo" pathLength={1} d="M8 268 H52 V278 H8 Z M3 278 H57 V292 H3 Z M0 292 H60 V300 H0 Z" />
    </svg>
  );
}

// Laurel: una rama a cada lado del título. "espejo" la invierte.
export function Laurel({ className = "", espejo = false }: { className?: string; espejo?: boolean }) {
  const hojas = Array.from({ length: 7 }, (_, i) => {
    const t = (i / 6) * Math.PI * 0.9; // recorrido del arco
    const x = 60 - Math.sin(t) * 46;
    const y = 80 - Math.cos(t) * 62 + 6;
    const rot = -35 + i * 14;
    return { x, y, rot };
  });
  return (
    <svg viewBox="0 0 60 100" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="0.8" style={espejo ? { transform: "scaleX(-1)" } : undefined}>
      <path className="trazo" pathLength={1} d="M60 96 Q 10 70 14 20" />
      {hojas.map((h, i) => (
        <ellipse key={i} cx={h.x} cy={h.y} rx="5.5" ry="2.4" transform={`rotate(${h.rot} ${h.x} ${h.y})`} fill="currentColor" fillOpacity="0.18" className="trazo" />
      ))}
    </svg>
  );
}

// Greca griega (meandro) como divisor horizontal.
export function Greca({ className = "", unidades = 24 }: { className?: string; unidades?: number }) {
  const ancho = unidades * 12;
  const d = Array.from({ length: unidades }, (_, i) => {
    const x = i * 12;
    return `M${x} 10 V2 H${x + 9} V7 H${x + 4} V5 H${x + 6}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${ancho} 12`} width="100%" height="12" preserveAspectRatio="xMidYMid meet" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="0.9">
      <path className="trazo" pathLength={1} d={`M0 11 H${ancho}`} />
      <path className="trazo" pathLength={1} d={d} />
    </svg>
  );
}

// Frontón griego: triángulo con cornisa, para rematar el encabezado.
export function Fronton({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 240 60" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
      <path className="trazo" pathLength={1} d="M10 56 H230 M20 50 H220" />
      <path className="trazo" pathLength={1} d="M24 50 L120 6 L216 50" />
      <path className="trazo" pathLength={1} d="M38 50 L120 16 L202 50" strokeWidth="0.6" />
      <circle cx="120" cy="30" r="4" fill="currentColor" fillOpacity="0.25" className="trazo" pathLength={1} />
    </svg>
  );
}

// Vara de Esculapio: bastón con una serpiente enroscada. (El símbolo correcto de la medicina, no el caduceo.)
export function Esculapio({ className = "", alto = 48 }: { className?: string; alto?: number }) {
  const serpiente = Array.from({ length: 25 }, (_, i) => {
    const y = 8 + i * 2.2;
    const x = 20 + Math.sin(i * 0.9) * 7;
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 40 70" height={alto} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path className="trazo" pathLength={1} d="M20 2 V68" />
      <path className="trazo" pathLength={1} d="M14 4 H26 M14 6 H26" strokeWidth="0.8" />
      <path className="trazo" pathLength={1} d={serpiente} />
      <path className="trazo" pathLength={1} d="M10 68 H30" />
      <circle cx="20" cy="2" r="1.6" fill="currentColor" />
    </svg>
  );
}

// Divisor entre secciones: greca con la vara de Esculapio al centro.
export function DivisorClasico({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 text-[#C9A55C] ${className}`} aria-hidden="true">
      <Greca className="w-40 sm:w-64" unidades={12} />
      <Esculapio alto={30} />
      <Greca className="w-40 sm:w-64" unidades={12} />
    </div>
  );
}

// Medallón con el año de la promoción, para sellos y pies de página.
export function Medallon({ className = "", anio = "2026" }: { className?: string; anio?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle className="trazo" pathLength={1} cx="50" cy="50" r="46" />
      <circle className="trazo" pathLength={1} cx="50" cy="50" r="40" strokeWidth="0.6" />
      <text x="50" y="56" textAnchor="middle" fill="currentColor" stroke="none" fontSize="15" style={{ fontFamily: "var(--font-cinzel), Georgia, serif", letterSpacing: "0.08em" }}>{anio}</text>
    </svg>
  );
}
