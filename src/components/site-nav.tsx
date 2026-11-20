"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Barra superior en todas las páginas públicas: "← Volver" y "Inicio".
// No aparece en el panel de administración, la pantalla de ceremonia ni el libro para imprimir.
const OCULTAR = ["/admin", "/en-vivo", "/libro"];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  if (OCULTAR.some((p) => pathname.startsWith(p))) return null;
  const enInicio = pathname === "/";

  return (
    <nav aria-label="Navegación" className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-white/85 px-4 py-2.5 backdrop-blur">
      {enInicio ? (
        <span className="font-display text-lg text-secondary">Bata Blanca</span>
      ) : (
        <Button variant="secondary" onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))} className="!min-h-11 !px-4 !py-2">
          ← Volver
        </Button>
      )}
      {!enInicio && (
        <Button variant="primary" href="/" className="!min-h-11 !px-4 !py-2">
          Inicio
        </Button>
      )}
    </nav>
  );
}
