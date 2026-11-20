"use client";

import { useState } from "react";
import { setLiveCall } from "./actions";

type Estudiante = { id: string; fullName: string; nickname: string | null };

// Control del llamado desde el celular: anterior y siguiente, y pausa (cerrar el llamado).
export function ControlLlamado({ lista, actualId }: { lista: Estudiante[]; actualId: string | null }) {
  const [indice, setIndice] = useState(() => (actualId ? lista.findIndex((e) => e.id === actualId) : -1));
  const [ocupado, setOcupado] = useState(false);
  const actual = indice >= 0 ? lista[indice] : null;

  async function ir(nuevo: number | null) {
    if (ocupado) return;
    setOcupado(true);
    await setLiveCall(nuevo === null ? null : lista[nuevo].id);
    setIndice(nuevo ?? -1);
    setOcupado(false);
  }

  return (
    <section aria-labelledby="control" className="paper-card p-5 sm:p-6">
      <h2 id="control" className="font-display text-xl text-secondary">Control del llamado</h2>
      <p className="mt-1 text-[15px] text-muted">{actual ? `En pantalla: ${actual.fullName}` : "Nadie en pantalla todavía"}</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <button type="button" disabled={ocupado || indice <= 0} onClick={() => void ir(indice - 1)} className="min-h-14 rounded-2xl border border-line text-[15px] font-medium text-secondary disabled:opacity-40">← Anterior</button>
        <button type="button" disabled={ocupado} onClick={() => void ir(null)} className="min-h-14 rounded-2xl border border-line text-[15px] text-secondary disabled:opacity-40">Pausa</button>
        <button type="button" disabled={ocupado || indice >= lista.length - 1} onClick={() => void ir(indice < 0 ? 0 : indice + 1)} className="min-h-14 rounded-2xl bg-primary text-[15px] font-medium text-white disabled:opacity-40">Siguiente →</button>
      </div>
      {actual && indice < lista.length - 1 && (
        <p className="mt-3 text-sm text-muted">Sigue: {lista[indice + 1].fullName}</p>
      )}
    </section>
  );
}
