"use client";

import { useState } from "react";

// Comparte un recuerdo: usa el menú de compartir del celular si existe; si no, copia el enlace.
export function CompartirBoton({ ruta, titulo }: { ruta: string; titulo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    const url = `${window.location.origin}${ruta}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: titulo, text: "Bata Blanca · Medicina, Universidad de Sucre", url });
        return;
      } catch {
        // El usuario canceló o no está disponible: se intenta copiar.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso para copiar: no hay nada más que hacer.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void compartir()}
      className="min-h-11 rounded-full border border-line bg-white px-4 text-xs text-secondary transition hover:border-primary"
      aria-live="polite"
    >
      {copiado ? "¡Enlace copiado!" : "🔗 Compartir"}
    </button>
  );
}
