"use client";

import { useActionState } from "react";
import type { StudentFormState } from "./actions";

type Defaults = { fullName?: string; nickname?: string | null; quote?: string | null; specialRole?: string | null; orderIndex?: number };

const field = "bb-input";

export function StudentForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: StudentFormState, formData: FormData) => Promise<StudentFormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<StudentFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="bb-label">Nombre completo</span>
        <input name="fullName" required defaultValue={defaults?.fullName ?? ""} className={field} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="bb-label">Apodo</span>
          <input name="nickname" defaultValue={defaults?.nickname ?? ""} className={field} />
        </label>
        <label className="block">
          <span className="bb-label">Rol especial (opcional)</span>
          <input name="specialRole" placeholder="Representante" defaultValue={defaults?.specialRole ?? ""} className={field} />
        </label>
      </div>
      <label className="block">
        <span className="bb-label">Frase</span>
        <input name="quote" maxLength={200} defaultValue={defaults?.quote ?? ""} className={field} />
      </label>
      <label className="block">
        <span className="bb-label">Orden en la lista</span>
        <input name="orderIndex" type="number" min={0} defaultValue={defaults?.orderIndex ?? 0} className={field} />
      </label>

      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-primary">Guardado.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}

export function DeleteStudentButton({ remove }: { remove: () => Promise<StudentFormState> }) {
  const [state, formAction, pending] = useActionState<StudentFormState, FormData>(() => remove(), undefined);

  return (
    <form action={formAction} className="space-y-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Revisando…" : "Quitar de la lista"}
      </button>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
