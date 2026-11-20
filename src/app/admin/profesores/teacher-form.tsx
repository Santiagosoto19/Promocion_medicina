"use client";

import { useActionState } from "react";
import type { TeacherState } from "./actions";

export function TeacherForm({ action }: { action: (prev: TeacherState, formData: FormData) => Promise<TeacherState> }) {
  const [state, formAction, pending] = useActionState<TeacherState, FormData>(action, undefined);
  const field = "bb-input";
  return (
    <form action={formAction} className="space-y-3">
      <label className="block"><span className="bb-label">Nombre</span><input name="name" required maxLength={120} className={field} /></label>
      <label className="block"><span className="bb-label">Materia (opcional)</span><input name="subject" maxLength={120} className={field} /></label>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:brightness-110 disabled:opacity-60">Agregar profesor</button>
    </form>
  );
}
