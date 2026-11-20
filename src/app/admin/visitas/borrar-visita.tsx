"use client";

import { useState } from "react";
import { deleteGuestEntry } from "./actions";

// Borrado de una visita con confirmación en dos pasos, como en la moderación.
export function BorrarVisita({ id }: { id: string }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button type="button" onClick={() => setConfirmando(true)} className="min-h-11 rounded-lg border border-red-200 px-3 text-sm text-red-700">
        Eliminar
      </button>
    );
  }

  return (
    <form action={deleteGuestEntry.bind(null, id)} className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-red-800">¿Borrar para siempre?</span>
      <button className="min-h-11 rounded-lg bg-red-700 px-3 text-sm font-medium text-white">Sí, borrar</button>
      <button type="button" onClick={() => setConfirmando(false)} className="min-h-11 rounded-lg border border-line px-3 text-sm">No</button>
    </form>
  );
}
