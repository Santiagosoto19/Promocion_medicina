"use client";

import { useActionState } from "react";
import type { EventState } from "./actions";

const field = "bb-input";

export function EventForm({ action }: { action: (prev: EventState, formData: FormData) => Promise<EventState> }) {
  const [state, formAction, pending] = useActionState<EventState, FormData>(action, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <label className="block"><span className="bb-label">Título</span><input name="title" required maxLength={120} className={field} /></label>
      <label className="block"><span className="bb-label">Fecha o momento (opcional)</span><input name="eventDate" placeholder="Semestre 4 · marzo 2025" maxLength={60} className={field} /></label>
      <label className="block"><span className="bb-label">Descripción (opcional)</span><textarea name="description" rows={2} maxLength={400} className={field} /></label>
      <label className="block"><span className="bb-label">Orden</span><input name="orderIndex" type="number" min={0} defaultValue={0} className={field} /></label>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-primary">Hito agregado.</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:brightness-110 disabled:opacity-60">
        {pending ? "Guardando…" : "Agregar hito"}
      </button>
    </form>
  );
}
