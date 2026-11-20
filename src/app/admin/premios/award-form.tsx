"use client";

import { useActionState } from "react";
import type { AwardState } from "./actions";

export function AwardForm({ action }: { action: (prev: AwardState, formData: FormData) => Promise<AwardState> }) {
  const [state, formAction, pending] = useActionState<AwardState, FormData>(action, undefined);
  const field = "bb-input";
  return (
    <form action={formAction} className="space-y-3">
      <label className="block"><span className="bb-label">Categoría</span><input name="title" required maxLength={120} placeholder="El que siempre llega tarde" className={field} /></label>
      <label className="block"><span className="bb-label">Descripción (opcional)</span><input name="description" maxLength={200} className={field} /></label>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:brightness-110 disabled:opacity-60">Agregar categoría</button>
    </form>
  );
}
