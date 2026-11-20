"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Calendar, Home, ImageIcon, Lock, Menu, MessageSquare, Palette, Settings, Sparkles, Trophy, Users, Video, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";

type Counts = { pendientes: number; visitas: number; diasCeremonia: number | null };

const GRUPOS = [
  { titulo: "General", items: [{ href: "/admin", label: "Inicio", icon: Home }] },
  {
    titulo: "Contenido",
    items: [
      { href: "/admin/moderacion", label: "Moderación", icon: ImageIcon, contador: "pendientes" as const },
      { href: "/admin/contenido", label: "Contenido de portada", icon: Sparkles },
      { href: "/admin/linea", label: "Línea de tiempo", icon: Calendar },
      { href: "/admin/juramento", label: "Juramento", icon: BookOpen },
      { href: "/admin/profesores", label: "Profesores", icon: Users },
      { href: "/admin/visitas", label: "Libro de visitas", icon: MessageSquare, contador: "visitas" as const },
    ],
  },
  { titulo: "Personas", items: [{ href: "/admin/promocion", label: "Promoción", icon: Users }] },
  {
    titulo: "Día de la ceremonia",
    items: [
      { href: "/admin/ceremonia", label: "Ceremonia", icon: Video },
      { href: "/admin/premios", label: "Premios", icon: Trophy },
    ],
  },
  {
    titulo: "Configuración",
    items: [
      { href: "/admin/tema", label: "Tema", icon: Palette },
      { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
    ],
  },
];

const BARRA_MOVIL = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/moderacion", label: "Moderar", icon: ImageIcon, contador: "pendientes" as const },
  { href: "/admin/ceremonia", label: "Ceremonia", icon: Video },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
];

function activo(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function Contador({ n, rosa }: { n: number; rosa?: boolean }) {
  if (!n) return null;
  return (
    <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${rosa ? "bg-[#F4A7B9]/60 text-[#7A2E4D]" : "bg-primary/10 text-[#0B6870]"}`}>
      {n}
    </span>
  );
}

// Marco del panel: barra lateral en escritorio y barra inferior en celular. El login no lo usa.
export function AdminShell({ counts, children }: { counts: Counts; children: ReactNode }) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  if (pathname.startsWith("/admin/login")) return <>{children}</>;

  const valor = (k?: "pendientes" | "visitas") => (k ? counts[k] : 0);
  const nav = (
    <nav aria-label="Panel" className="flex flex-col gap-5">
      {GRUPOS.map((g) => (
        <div key={g.titulo}>
          <p className="mb-1.5 px-3 text-[13px] font-bold tracking-[0.12em] text-muted uppercase">{g.titulo}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const on = activo(pathname, it.href);
              const Icon = it.icon;
              return (
                <li key={it.href} className="relative">
                  {on && (
                    <motion.span layoutId="admin-activo" className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-primary" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                  )}
                  <Link
                    href={it.href}
                    onClick={() => setMenuAbierto(false)}
                    aria-current={on ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition hover:bg-primary/[0.06] ${on ? "bg-primary/10 text-[#0B6870]" : "text-text"}`}
                  >
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    {it.label}
                    <Contador n={valor(it.contador)} rosa={it.contador === "pendientes"} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const pie = (
    <div className="mt-auto space-y-3">
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">Ceremonia</p>
        <p className="mt-1 font-display text-lg text-secondary">
          {counts.diasCeremonia === null ? "Fecha sin definir" : counts.diasCeremonia > 0 ? `Faltan ${counts.diasCeremonia} días` : "¡Hoy es el día!"}
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/" target="_blank" className="flex min-h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-line bg-white text-sm text-secondary hover:border-primary">
          Ver sitio ↗
        </Link>
        <form action={logoutAction} className="flex-1">
          <button className="flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-line bg-white text-sm text-secondary hover:border-primary">
            <Lock size={14} aria-hidden="true" /> Salir
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#F7F9FB] lg:flex">
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-[#FBFCFD] p-5 lg:flex">
        <div>
          <p className="font-display text-xl text-secondary">Bata Blanca</p>
          <span className="mt-1 inline-block rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-[#6B5210]">Panel</span>
        </div>
        {nav}
        {pie}
      </aside>

      {/* Celular: cabecera con menú */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line">
          <Menu size={20} aria-hidden="true" />
        </button>
        <p className="font-display text-lg text-secondary">Bata Blanca</p>
        <span className="flex h-11 min-w-11 items-center justify-center rounded-xl px-2 text-sm font-semibold text-primary">{counts.pendientes || ""}</span>
      </header>
      <AnimatePresence>
        {menuAbierto && (
          <motion.div className="fixed inset-0 z-40 bg-secondary/30 lg:hidden" onClick={() => setMenuAbierto(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="absolute inset-y-0 left-0 flex w-[280px] flex-col gap-6 overflow-y-auto bg-[#FBFCFD] p-5"
              onClick={(e) => e.stopPropagation()}
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-xl text-secondary">Panel</p>
                <button type="button" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {nav}
              {pie}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</div>

      {/* Celular: barra inferior con el pulgar */}
      <nav aria-label="Accesos rápidos" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {BARRA_MOVIL.map((it) => {
          const on = activo(pathname, it.href);
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[13px] font-medium ${on ? "text-primary" : "text-muted"}`}>
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              {it.label}
              {valor(it.contador) > 0 && <span className="absolute top-1 right-3 rounded-full bg-[#B4235A] px-1.5 text-[10px] font-bold text-white">{valor(it.contador)}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
