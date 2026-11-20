"use client";

import { useMemo, useState } from "react";
import { GaleriaView, type GaleriaItem } from "./galeria-view";

type Tipo = "" | "photo" | "video" | "audio";

const PESTANAS: { valor: Tipo; label: string }[] = [
  { valor: "", label: "Todos" },
  { valor: "photo", label: "Fotos" },
  { valor: "video", label: "Videos" },
  { valor: "audio", label: "Notas de voz" },
];

// Filtros en el navegador: cambian al instante, sin recargar la página.
export function GaleriaFiltrable({ items, estudiantes }: { items: GaleriaItem[]; estudiantes: { id: string; fullName: string }[] }) {
  const [tipo, setTipo] = useState<Tipo>("");
  const [alumno, setAlumno] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return items.filter((i) => {
      if (tipo && i.type !== tipo) return false;
      if (alumno && i.studentId !== alumno) return false;
      if (!texto) return true;
      const donde = [i.studentName, i.nickname, i.title, i.body].filter(Boolean).join(" ").toLowerCase();
      return donde.includes(texto);
    });
  }, [items, tipo, alumno, busqueda]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <input
          type="search"
          aria-label="Buscar en la galería"
          placeholder="Buscar por nombre, título o texto…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bb-input !w-auto min-w-0 flex-1 !min-h-10 !py-2 text-sm sm:max-w-xs"
        />
        <select aria-label="Filtrar por estudiante" value={alumno} onChange={(e) => setAlumno(e.target.value)} className="bb-input !w-auto !min-h-10 !py-2 text-sm">
          <option value="">Todos los estudiantes</option>
          {estudiantes.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName}</option>
          ))}
        </select>
        <select aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className="bb-input !w-auto !min-h-10 !py-2 text-sm">
          <option value="">Todo</option>
          <option value="photo">Fotos</option>
          <option value="video">Videos</option>
          <option value="audio">Notas de voz</option>
        </select>
      </div>

      <div role="tablist" aria-label="Tipo de recuerdo" className="mt-6 flex flex-wrap gap-1">
        {PESTANAS.map((t) => {
          const activa = tipo === t.valor;
          return (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setTipo(t.valor)}
              className={`min-h-11 rounded-t-xl border border-b-0 px-5 py-3 text-sm font-medium transition ${activa ? "border-line bg-white text-primary shadow-sm" : "border-transparent bg-surface text-muted hover:text-text"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {filtrados.length === 0 ? (
          <p className="py-16 text-center text-muted">No hay recuerdos con estos filtros todavía. ¿Tienes alguno? 📸</p>
        ) : (
          <GaleriaView items={filtrados} />
        )}
      </div>
    </>
  );
}
