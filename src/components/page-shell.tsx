import type { ReactNode } from "react";
import { MedicalFloaters } from "@/components/medico/floaters";

// Encabezado común de las páginas: volver, etiqueta, título con brillo dorado y una frase de apoyo.
export function PageShell({
  eyebrow,
  title,
  lede,
  children,
  width = "max-w-4xl",
}: {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-paper px-4 pt-10 pb-28 lg:pb-10">
      <MedicalFloaters />
      <div className="glow-teal pointer-events-none absolute -top-24 left-1/2 -z-10 h-[460px] w-[460px] -translate-x-[70%] rounded-full" aria-hidden="true" />
      <div className="glow-gold pointer-events-none absolute top-1/3 -right-24 -z-10 h-[380px] w-[380px] rounded-full" aria-hidden="true" />
      <div className={`mx-auto ${width}`}>
        <header className="mt-4 mb-10">
          {eyebrow && <p className="font-hand text-xl text-muted">{eyebrow}</p>}
          <h1 className="page-title mt-2 font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
          {lede && <div className="mt-3 max-w-2xl font-hand text-2xl text-primary">{lede}</div>}
        </header>
        {children}
      </div>
    </main>
  );
}
