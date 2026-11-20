"use client";

import { useEffect, useRef, useState } from "react";

// Cuenta regresiva con dígitos que giran al cambiar. Al llegar la hora, confeti dorado.
export function Countdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  const [now, setNow] = useState<number | null>(null);
  const celebrated = useRef(false);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (now === null || celebrated.current || target - now > 0) return;
    celebrated.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void import("canvas-confetti").then(({ default: confetti }) => {
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, colors: ["#C9A227", "#F1D77E", "#0E7C86", "#F4A7B9"] });
    });
  }, [now, target]);

  if (now === null) return <div className="h-24" aria-hidden="true" />;

  const diff = target - now;
  if (diff <= 0) {
    return <p className="font-display text-4xl text-gold sm:text-5xl">¡Hoy es el día! 🩺</p>;
  }

  const parts = [
    { label: "días", value: Math.floor(diff / 86_400_000) },
    { label: "horas", value: Math.floor((diff % 86_400_000) / 3_600_000) },
    { label: "minutos", value: Math.floor((diff % 3_600_000) / 60_000) },
    { label: "segundos", value: Math.floor((diff % 60_000) / 1000) },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-hand text-xl text-muted">Faltan para la entrega de batas, el 5 de diciembre</p>
      <div role="timer" className="flex items-start justify-center gap-2 sm:gap-4" aria-label="Tiempo que falta para la ceremonia">
        {parts.map((u, i) => (
          <div key={u.label} className="flex items-start gap-2 sm:gap-4">
            <div className="text-center">
              <div className="flex gap-1">
                {String(u.value).padStart(2, "0").split("").map((d, j) => (
                  <span
                    key={`${u.label}-${j}-${d}`}
                    className="digit-flip inline-block min-w-[0.6em] font-display text-3xl text-secondary tabular-nums sm:text-5xl"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="mx-auto mt-1 h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent" />
              <span className="mt-1 block text-sm font-semibold text-muted">{u.label}</span>
            </div>
            {i < parts.length - 1 && (
              <span className="mt-2 animate-pulse font-display text-3xl text-gold sm:text-5xl" aria-hidden="true">
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
