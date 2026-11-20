"use client";

import { useEsAdmin } from "@/lib/use-es-admin";

// Aviso de modo edición: solo se ve si quien mira tiene sesión de admin.
export function AvisoEdicion() {
  const admin = useEsAdmin();
  if (!admin) return null;
  return (
    <p className="mb-4 rounded-lg border border-gold/50 bg-gold/10 px-3 py-2 text-center text-xs text-secondary">
      Modo edición: haz clic en el título o el subtítulo para cambiarlos. Se guardan al salir del campo.
    </p>
  );
}
