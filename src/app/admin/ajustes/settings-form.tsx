"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "./actions";

export function SettingsForm({ moderationRequired, ceremonyAt }: { moderationRequired: boolean; ceremonyAt: string }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(saveSettings, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <label className="block">
        <span className="bb-label">Fecha y hora de la ceremonia (hora de Colombia)</span>
        <input
          name="ceremonyAt"
          type="datetime-local"
          defaultValue={ceremonyAt}
          className="bb-input"
        />
      </label>

      <label className="flex items-start gap-3">
        <input name="moderationRequired" type="checkbox" defaultChecked={moderationRequired} className="mt-1 h-4 w-4 accent-primary" />
        <span>
          <span className="bb-label">Revisar cada recuerdo antes de publicarlo</span>
          <span className="block text-xs text-muted">Recomendado. Los recuerdos nuevos quedan pendientes hasta que los apruebes.</span>
        </span>
      </label>

      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-primary">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar ajustes"}
      </button>
    </form>
  );
}
