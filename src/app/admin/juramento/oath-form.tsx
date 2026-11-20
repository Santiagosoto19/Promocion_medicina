"use client";

import { useActionState } from "react";

type State = { ok?: boolean; error?: string } | undefined;

export function OathForm({
  action,
  initial,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  initial: string;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <textarea
        aria-label="Texto del juramento"
        name="oathText"
        defaultValue={initial}
        rows={14}
        maxLength={5000}
        className="bb-input"
      />
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-primary">Juramento guardado.</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:brightness-110 disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar juramento"}
      </button>
    </form>
  );
}
