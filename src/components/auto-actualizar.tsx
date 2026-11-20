"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const CADA_MS = 30_000;

// Rutas donde no se actualiza sola: subida de archivos y firma a mano (no se deben interrumpir),
// panel de admin y el modo ceremonia (que ya tiene su propia actualización).
const SIN_AUTO = ["/admin", "/en-vivo", "/subir", "/firma/firmar"];

// Mantiene la información al día: vuelve a leer los datos del servidor cada 30 s y al regresar a la pestaña.
// No actualiza mientras alguien escribe, para no interrumpirlo.
export function AutoActualizar() {
  const router = useRouter();
  const ruta = usePathname();

  useEffect(() => {
    if (SIN_AUTO.some((r) => ruta.startsWith(r))) return;

    const escribiendo = () => {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable);
    };
    const refrescar = () => {
      if (document.visibilityState !== "visible" || escribiendo()) return;
      router.refresh();
    };

    const id = setInterval(refrescar, CADA_MS);
    document.addEventListener("visibilitychange", refrescar);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refrescar);
    };
  }, [router, ruta]);

  return null;
}
