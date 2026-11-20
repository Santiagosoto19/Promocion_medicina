"use client";

import { useEffect, useState } from "react";

// Indica si quien mira la página tiene sesión de admin. Consulta /api/me una sola vez por carga.
// Mientras responde, se muestra la página como para cualquier visitante (sin botones de edición).
export function useEsAdmin(): boolean {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let vigente = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { admin: false }))
      .then((d: { admin?: boolean }) => {
        if (vigente) setAdmin(d.admin === true);
      })
      .catch(() => {
        // Sin conexión o error: se queda como visitante.
      });
    return () => {
      vigente = false;
    };
  }, []);

  return admin;
}
