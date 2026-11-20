"use client";

import { Home, Images, PenLine, Plus, Shell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra inferior en celular, como en el panel: accesos con el pulgar y "＋" dorado al centro.
const OCULTAR = ["/admin", "/en-vivo", "/libro"];

export function PublicTabBar() {
  const pathname = usePathname();
  if (OCULTAR.some((p) => pathname.startsWith(p))) return null;

  const items = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/galeria", label: "Galería", icon: Images },
    { href: "/subir", label: "Subir", icon: Plus, central: true },
    { href: "/firma", label: "La bata", icon: Shell },
    { href: "/mensajes", label: "Recetas", icon: PenLine },
  ];

  return (
    <nav aria-label="Accesos rápidos" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t border-line bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      {items.map((it) => {
        const on = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        const Icon = it.icon;
        if (it.central) {
          return (
            <Link key={it.href} href={it.href} aria-label="Subir recuerdo" className="mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#F1D77E] via-[#C9A227] to-[#9C7A16] text-secondary shadow-[0_8px_20px_rgba(201,162,39,0.45)] [animation:bb-beat_6s_ease-in-out_infinite]">
              <Icon size={26} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          );
        }
        return (
          <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined} className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[13px] font-medium ${on ? "text-primary" : "text-muted"}`}>
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
