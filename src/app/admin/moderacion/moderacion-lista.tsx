"use client";

import { useEffect, useMemo, useState } from "react";
import { MemoryMedia } from "@/components/memory-media";
import { useToast } from "@/components/ui/toast";
import { deleteMemory, setMemoryStatus } from "./actions";

export type Item = {
  id: string;
  type: "photo" | "video" | "audio" | "message" | "signature";
  publicId: string | null;
  title: string | null;
  body: string | null;
  path: string | null;
  width: number | null;
  height: number | null;
  studentName: string;
};

type Estado = "approved" | "hidden";

// Lista de moderación: selección múltiple, atajos de teclado (A aprobar, O ocultar, ? ayuda) y acciones en lote.
// Eliminar es definitivo: pide confirmación en dos pasos y lo registra en auditoría.
export function ModeracionLista({ pendientes, ocultos, publicados = [] }: { pendientes: Item[]; ocultos: Item[]; publicados?: Item[] }) {
  const { avisar } = useToast();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [foco, setFoco] = useState(0);
  const [ayuda, setAyuda] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [quitados, setQuitados] = useState<Set<string>>(new Set());
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const visibles = useMemo(() => pendientes.filter((p) => !quitados.has(p.id)), [pendientes, quitados]);
  const ocultosVisibles = useMemo(() => ocultos.filter((p) => !quitados.has(p.id)), [ocultos, quitados]);
  const publicadosVisibles = useMemo(() => publicados.filter((p) => !quitados.has(p.id)), [publicados, quitados]);

  async function aplicar(ids: string[], estado: Estado) {
    if (ids.length === 0 || ocupado) return;
    setOcupado(true);
    await Promise.all(ids.map((id) => setMemoryStatus(id, estado)));
    setQuitados((q) => new Set([...q, ...ids]));
    setSeleccion(new Set());
    setOcupado(false);
    avisar(`${ids.length === 1 ? "Recuerdo" : `${ids.length} recuerdos`} ${estado === "approved" ? "aprobado" : "ocultado"}${ids.length === 1 ? "" : "s"}`, "ok");
  }

  async function eliminar(id: string) {
    if (ocupado) return;
    setOcupado(true);
    const res = await deleteMemory(id);
    setOcupado(false);
    setConfirmando(null);
    if (!res.ok) {
      avisar(res.error ?? "No se pudo eliminar.", "error");
      return;
    }
    setQuitados((q) => new Set([...q, id]));
    setSeleccion((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    avisar("Publicación eliminada", "ok");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.key === "?") return setAyuda((a) => !a);
      if (e.key === "ArrowRight") return setFoco((f) => Math.min(visibles.length - 1, f + 1));
      if (e.key === "ArrowLeft") return setFoco((f) => Math.max(0, f - 1));
      const actual = visibles[foco];
      if (!actual) return;
      if (e.key === "a" || e.key === "A") void aplicar([actual.id], "approved");
      if (e.key === "o" || e.key === "O") void aplicar([actual.id], "hidden");
      if (e.key === " ") {
        e.preventDefault();
        setSeleccion((s) => {
          const n = new Set(s);
          if (n.has(actual.id)) n.delete(actual.id);
          else n.add(actual.id);
          return n;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibles, foco, ocupado]);

  const seleccionados = [...seleccion];

  // Botón de borrado con confirmación en dos pasos: primero "Eliminar", luego "Sí, borrar para siempre".
  const renderEliminar = (id: string) => {
    if (confirmando !== id) {
      return (
        <button type="button" disabled={ocupado} onClick={() => setConfirmando(id)} className="min-h-11 rounded-xl border border-red-200 px-4 text-sm text-red-700 disabled:opacity-60">
          Eliminar
        </button>
      );
    }
    return (
      <div role="group" aria-label="Confirmar eliminación" className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2">
        <p className="flex-1 text-xs text-red-800">¿Borrar para siempre? No se puede deshacer.</p>
        <button type="button" disabled={ocupado} onClick={() => void eliminar(id)} className="min-h-11 rounded-lg bg-red-700 px-3 text-sm font-medium text-white disabled:opacity-60">
          Sí, borrar
        </button>
        <button type="button" disabled={ocupado} onClick={() => setConfirmando(null)} className="min-h-11 rounded-lg border border-line px-3 text-sm text-secondary disabled:opacity-60">
          Cancelar
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {seleccionados.length > 0 && (
        <div role="region" aria-label="Acciones para la selección" className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/50 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-sm font-medium text-secondary">{seleccionados.length} seleccionados</p>
          <div className="flex gap-2">
            <button type="button" disabled={ocupado} onClick={() => void aplicar(seleccionados, "approved")} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:opacity-60">
              ✓ Aprobar {seleccionados.length}
            </button>
            <button type="button" disabled={ocupado} onClick={() => void aplicar(seleccionados, "hidden")} className="min-h-11 rounded-xl border border-line px-4 text-sm text-secondary disabled:opacity-60">
              Ocultar
            </button>
          </div>
        </div>
      )}

      <section aria-labelledby="pend">
        <div className="flex items-center justify-between gap-3">
          <h2 id="pend" className="font-display text-xl text-secondary">Por revisar ({visibles.length})</h2>
          {visibles.length > 0 && (
            <button type="button" onClick={() => setSeleccion(new Set(visibles.map((v) => v.id)))} className="min-h-11 text-sm text-primary underline underline-offset-4">
              Seleccionar todo
            </button>
          )}
        </div>
        {visibles.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center font-hand text-2xl text-primary">Nada por revisar. ✨</p>
        ) : (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {visibles.map((it, i) => {
              const marcado = seleccion.has(it.id);
              return (
                <li key={it.id} className={`paper-card relative overflow-hidden transition ${i === foco ? "ring-2 ring-primary/40" : ""}`} onFocus={() => setFoco(i)}>
                  <label className="absolute top-3 left-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-white/90 shadow">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => setSeleccion((s) => {
                        const n = new Set(s);
                        if (n.has(it.id)) n.delete(it.id);
                        else n.add(it.id);
                        return n;
                      })}
                      aria-label={`Seleccionar recuerdo de ${it.studentName}`}
                      className="h-5 w-5 accent-primary"
                    />
                  </label>
                  <MemoryMedia type={it.type} path={it.path} publicId={it.publicId} width={it.width} height={it.height} alt={it.title ?? `Recuerdo de ${it.studentName}`} data={it.body} />
                  <div className="space-y-2 p-4">
                    <p className="text-sm text-text">{it.studentName}</p>
                    {it.title && <p className="font-display text-base text-secondary">{it.title}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button type="button" disabled={ocupado} onClick={() => void aplicar([it.id], "approved")} className="min-h-11 flex-1 rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60">✓ Aprobar</button>
                      <button type="button" disabled={ocupado} onClick={() => void aplicar([it.id], "hidden")} className="min-h-11 rounded-xl border border-line px-4 text-sm text-secondary disabled:opacity-60">Ocultar</button>
                      {renderEliminar(it.id)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {publicadosVisibles.length > 0 && (
        <section aria-labelledby="pub">
          <h2 id="pub" className="font-display text-xl text-secondary">Publicados ({publicadosVisibles.length})</h2>
          <p className="mt-1 text-sm text-muted">Lo que ya se ve en la galería. Ocultar lo quita de la vista; Eliminar lo borra del todo.</p>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {publicadosVisibles.map((it) => (
              <li key={it.id} className="paper-card overflow-hidden">
                <MemoryMedia type={it.type} path={it.path} publicId={it.publicId} width={it.width} height={it.height} alt={it.title ?? `Recuerdo de ${it.studentName}`} data={it.body} />
                <div className="space-y-2 p-4">
                  <p className="text-sm text-text">{it.studentName}</p>
                  {it.title && <p className="font-display text-base text-secondary">{it.title}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" disabled={ocupado} onClick={() => void aplicar([it.id], "hidden")} className="min-h-11 flex-1 rounded-xl border border-line px-4 text-sm text-secondary disabled:opacity-60">Ocultar</button>
                    {renderEliminar(it.id)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ocultosVisibles.length > 0 && (
        <section aria-labelledby="ocu">
          <h2 id="ocu" className="font-display text-xl text-secondary">Ocultos ({ocultosVisibles.length})</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {ocultosVisibles.map((it) => (
              <li key={it.id} className="paper-card overflow-hidden opacity-80">
                <MemoryMedia type={it.type} path={it.path} publicId={it.publicId} width={it.width} height={it.height} alt={it.title ?? `Recuerdo de ${it.studentName}`} data={it.body} />
                <div className="space-y-2 p-4">
                  <p className="text-sm text-text">{it.studentName}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void aplicar([it.id], "approved")} className="min-h-11 flex-1 rounded-xl border border-line text-sm text-secondary">Mostrar de nuevo</button>
                    {renderEliminar(it.id)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" onClick={() => setAyuda((a) => !a)} className="fixed bottom-24 left-4 z-30 hidden min-h-11 rounded-full border border-line bg-white px-4 text-sm text-secondary shadow lg:block">
        Atajos ?
      </button>
      {ayuda && (
        <div role="dialog" aria-label="Atajos de teclado" className="fixed bottom-40 left-4 z-30 hidden rounded-2xl border border-line bg-white p-4 text-sm shadow-lg lg:block">
          <p><kbd>A</kbd> aprobar · <kbd>O</kbd> ocultar</p>
          <p><kbd>Espacio</kbd> seleccionar · <kbd>←</kbd> <kbd>→</kbd> navegar</p>
          <p><kbd>?</kbd> mostrar u ocultar esta ayuda</p>
        </div>
      )}
    </div>
  );
}
