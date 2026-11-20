"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Sello } from "@/components/sello";
import { loginAction, type LoginState } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, undefined);

  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-paper px-4 py-12">
      <div className="glow-teal pointer-events-none absolute -top-32 left-1/2 -z-10 h-[460px] w-[460px] -translate-x-1/2 rounded-full" aria-hidden="true" />
      <div className="glow-gold pointer-events-none absolute -bottom-24 right-0 -z-10 h-[380px] w-[380px] rounded-full" aria-hidden="true" />

      <div className="paper-card w-full max-w-md p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Sello size={76}>✚</Sello>
          <p className="mt-5 font-sans text-xs font-bold tracking-[0.2em] text-muted uppercase">Administración</p>
          <h1 className="page-title mt-2 font-display text-4xl">Entrar</h1>
          <p className="mt-2 font-hand text-xl text-primary">Solo para quien modera la promoción.</p>
        </div>

        <form action={formAction} className="mt-8 space-y-5">
          <label className="block">
            <span className="bb-label">Correo</span>
            <input name="email" type="email" autoComplete="username" required placeholder="tu@correo.com" className="bb-input mt-2" />
          </label>
          <label className="block">
            <span className="bb-label">Contraseña</span>
            <input name="password" type="password" autoComplete="current-password" required placeholder="••••••••••••" className="bb-input mt-2" />
          </label>

          {state?.error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <Button type="submit" loading={pending} className="w-full">
            🔐 Entrar al panel
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted">
          ¿Olvidaste la contraseña? Pídele al administrador que la renueve.
        </p>
      </div>
    </main>
  );
}
