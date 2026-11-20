import type { ReactNode } from "react";

// Sello de lacre dorado con borde irregular y relieve. Se usa para destacar contenido.
export function Sello({ children, size = 96, className = "" }: { children?: ReactNode; size?: number; className?: string }) {
  const pts = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r = 46 + (i % 2 === 0 ? 2.5 : -1.5);
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-md" aria-hidden="true">
        <defs>
          <radialGradient id="bb-lacre" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#F6E3A1" />
            <stop offset="0.45" stopColor="#C9A227" />
            <stop offset="1" stopColor="#8A6A12" />
          </radialGradient>
        </defs>
        <polygon points={pts} fill="url(#bb-lacre)" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="#8A6A12" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="2 3" />
      </svg>
      <span className="relative font-display text-sm font-semibold text-secondary">{children}</span>
    </span>
  );
}
