"use client";

import Link from "next/link";
import { useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "gold";

const base =
  "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold/70 min-h-11 px-6 py-2.5 text-[15px]";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-[#0E7C86] to-[#0B6870] text-white shadow-[0_0_0_3px_#fff,0_0_0_4.5px_rgba(201,162,39,0.55),0_10px_26px_rgba(14,124,134,0.32)] hover:-translate-y-0.5 hover:scale-[1.02]",
  secondary:
    "border border-primary/35 bg-white text-primary hover:border-primary hover:bg-primary/[0.06]",
  gold:
    "bg-gradient-to-br from-[#F1D77E] via-[#C9A227] to-[#9C7A16] text-secondary shadow-[0_10px_26px_rgba(201,162,39,0.35)] hover:-translate-y-0.5",
};

// Botón con ripple al hacer clic y brillo que cruza cada pocos segundos (primary y gold).
export function Button({
  variant = "primary",
  href,
  onClick,
  children,
  className = "",
  type = "button",
  loading = false,
  disabled = false,
}: {
  variant?: Variant;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
}) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [mag, setMag] = useState({ x: 0, y: 0 });
  const shine = variant === "primary" || variant === "gold";

  function ripple(e: MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 600);
  }

  const inner = (
    <>
      {shine && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent [animation:bb-sweep_4s_ease-in-out_infinite]" />
      )}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 [animation:bb-ripple_0.6s_ease-out_forwards]"
          style={{ left: r.x, top: r.y }}
        />
      ))}
      {loading ? (
        <svg viewBox="0 0 60 20" className="h-5 w-12" aria-label="Cargando" role="img">
          <path d="M0 10 H18 l3 -7 l4 14 l4 -10 l3 3 H60" className="ecg-line" pathLength={1} style={{ strokeWidth: 2, animationDuration: "1s" }} />
        </svg>
      ) : (
        children
      )}
    </>
  );
  // Magnético: el botón se atrae hasta 6 px hacia el cursor (solo escritorio).
  function attract(e: PointerEvent<HTMLElement>) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    setMag({ x: ((e.clientX - (r.left + r.width / 2)) / r.width) * 12, y: ((e.clientY - (r.top + r.height / 2)) / r.height) * 12 });
  }
  const magnetic = shine ? { transform: `translate(${mag.x}px, ${mag.y}px)` } : undefined;
  const cls = `${base} ${variants[variant]} ${disabled ? "pointer-events-none opacity-60" : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} style={magnetic} onPointerMove={attract} onPointerLeave={() => setMag({ x: 0, y: 0 })} onClick={(e) => { ripple(e); onClick?.(e); }}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} style={magnetic} disabled={disabled || loading} onPointerMove={attract} onPointerLeave={() => setMag({ x: 0, y: 0 })} onClick={(e) => { ripple(e); onClick?.(e); }}>
      {inner}
    </button>
  );
}
