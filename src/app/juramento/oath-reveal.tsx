"use client";

import { useEffect, useRef } from "react";

// Cada línea aparece al entrar en pantalla. Con "reducir movimiento" activo, se muestran todas de inmediato.
export function OathReveal({ lines }: { lines: string[] }) {
  const refs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      refs.current.forEach((el) => el?.classList.add("opacity-100"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("opacity-100", "translate-y-0");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.6 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [lines.length]);

  return (
    <div className="space-y-6">
      {lines.map((line, i) => (
        <p
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="translate-y-3 font-display text-2xl leading-relaxed text-text opacity-0 transition duration-700 ease-out sm:text-3xl"
        >
          {line || " "}
        </p>
      ))}
    </div>
  );
}
