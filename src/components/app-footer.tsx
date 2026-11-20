"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Medallon } from "@/components/clasico/ornamentos";

const KEY = "bb:animaciones";

// Pie de página con el interruptor "Animaciones: completas / suaves". Se recuerda en el navegador.
export function AppFooter() {
  const [soft, setSoft] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let value = false;
    try {
      value = localStorage.getItem(KEY) === "suaves";
    } catch {
      value = false;
    }
    setSoft(value);
    document.documentElement.classList.toggle("anim-soft", value);
  }, []);

  function toggle() {
    const next = !soft;
    setSoft(next);
    document.documentElement.classList.toggle("anim-soft", next);
    try {
      localStorage.setItem(KEY, next ? "suaves" : "completas");
    } catch {
      // Sin almacenamiento, el cambio dura solo esta visita.
    }
  }

  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="border-t border-line bg-paper px-4 py-8 pb-24 text-center text-sm text-muted lg:pb-8">
      <Medallon className="mx-auto h-16 w-16 text-[#c9a55c]" />
      <p className="mt-3 font-hand text-xl text-primary">Bata Blanca · Universidad de Sucre · 2026</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={toggle} className="rounded-full border border-line bg-white px-4 py-1.5 text-xs text-secondary transition hover:border-primary">
          ✨ Animaciones: {soft ? "suaves" : "completas"}
        </button>
        <button type="button" onClick={() => { try { localStorage.removeItem("bb:intro-vista"); } catch { /* sin almacenamiento */ } window.location.reload(); }} className="rounded-full border border-line bg-white px-4 py-1.5 text-xs text-secondary transition hover:border-primary">
          📖 Ver la intro del libro
        </button>
        <Link href="/admin" className="rounded-full border border-line bg-white px-4 py-1.5 text-xs text-secondary transition hover:border-primary">
          🔐 Acceso del administrador
        </Link>
      </div>
    </footer>
  );
}
