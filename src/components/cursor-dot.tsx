"use client";

import { useEffect, useRef } from "react";

// Punto teal que sigue el cursor en escritorio. Crece sobre enlaces, botones y fotos.
export function CursorDot() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dot.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      el.style.display = "none";
      return;
    }
    const move = (e: PointerEvent) => {
      el.style.opacity = "1";
      el.style.transform = `translate(${e.clientX - 5}px, ${e.clientY - 5}px)`;
      const target = e.target as HTMLElement | null;
      const grande = !!target?.closest("a, button, img, video, [data-cursor]");
      el.style.width = el.style.height = grande ? "40px" : "10px";
      el.style.marginLeft = el.style.marginTop = grande ? "-15px" : "0px";
      el.style.background = grande ? "rgba(201,162,39,0.35)" : "#0E7C86";
      el.style.border = grande ? "1.5px solid #C9A227" : "none";
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[70] rounded-full opacity-0 transition-[width,height,background,margin] duration-200 ease-out"
      style={{ width: 10, height: 10, background: "#0E7C86" }}
    />
  );
}
