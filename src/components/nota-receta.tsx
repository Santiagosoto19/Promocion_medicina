import type { ReactNode } from "react";

// Papel tipo receta médica: membrete "Rx", líneas tenues y texto manuscrito.
export function NotaReceta({
  children,
  firma,
  para,
  rotate = 0,
  className = "",
}: {
  children: ReactNode;
  firma?: ReactNode;
  para?: string;
  rotate?: number;
  className?: string;
}) {
  return (
    <article
      className={`relative rounded-md border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,42,58,0.06),0_10px_26px_rgba(15,42,58,0.10)] ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 27px, rgba(14,124,134,0.10) 27px 28px)" }}
    >
      <div className="mb-3 flex items-baseline justify-between border-b border-primary/25 pb-2">
        <span className="font-display text-2xl font-semibold text-primary">Rx</span>
        <span className="font-hand text-base text-muted">Promoción 2026</span>
      </div>
      {para && <p className="font-hand text-xl text-primary">Para {para}</p>}
      <div className="mt-1 whitespace-pre-line font-hand text-2xl leading-[28px] text-text">{children}</div>
      {firma && <p className="mt-4 text-right font-hand text-xl text-secondary">— {firma}</p>}
    </article>
  );
}
