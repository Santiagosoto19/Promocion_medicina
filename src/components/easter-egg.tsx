"use client";

import { useEffect, useState } from "react";

// Al escribir "bata" en cualquier página, caen mini batas. Sin efecto con movimiento reducido.
export function EasterEgg() {
  const [drops, setDrops] = useState<{ id: number; left: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    let buffer = "";
    let nextId = 0;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-4);
      if (buffer !== "bata") return;
      buffer = "";
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const batch = Array.from({ length: 24 }, () => ({
        id: nextId++,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        size: 18 + Math.random() * 14,
      }));
      setDrops((d) => [...d, ...batch]);
      setTimeout(() => setDrops((d) => d.filter((x) => !batch.some((b) => b.id === x.id))), 4500);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (drops.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {drops.map((d) => (
        <span
          key={d.id}
          className="absolute -top-10"
          style={{ left: `${d.left}%`, fontSize: d.size, animation: `bb-fall 3.6s ease-in ${d.delay}s forwards` }}
        >
          🥼
        </span>
      ))}
    </div>
  );
}
