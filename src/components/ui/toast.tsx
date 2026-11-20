"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Tipo = "ok" | "error" | "info";
type Aviso = { id: number; texto: string; tipo: Tipo };
type Ctx = { avisar: (texto: string, tipo?: Tipo) => void };

const ToastCtx = createContext<Ctx>({ avisar: () => {} });
export const useToast = () => useContext(ToastCtx);

// Tarjetas doradas que entran desde abajo y se van solas. Se usan para resultados de acciones.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const avisar = useCallback((texto: string, tipo: Tipo = "ok") => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a.slice(-2), { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastCtx.Provider value={{ avisar }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div
            key={a.id}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border bg-white px-5 py-3 text-sm text-text shadow-[0_12px_32px_rgba(15,42,58,0.16)] [animation:bb-toast-in_0.45s_cubic-bezier(0.22,1,0.36,1)_both] ${
              a.tipo === "error" ? "border-red-300" : "border-gold/60"
            }`}
            style={{ left: "50%", position: "relative" }}
          >
            <span aria-hidden="true" className="text-lg">
              {a.tipo === "ok" ? "✓" : a.tipo === "error" ? "✗" : "✦"}
            </span>
            <span>{a.texto}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
