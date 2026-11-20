import Link from "next/link";
import { getSettings } from "@/lib/access";
import { requireAdmin } from "@/lib/admin-session";
import { resolveTheme, THEME_PRESETS } from "@/lib/themes";
import { ThemeForm } from "./theme-form";

export default async function TemaAdmin() {
  await requireAdmin();
  const settings = await getSettings();
  const current = resolveTheme(settings.theme);
  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
        <h1 className="page-title font-display text-3xl">Tema</h1>
        <p className="text-sm text-muted">Cambia los colores de todo el sitio. El fondo siempre se queda blanco.</p>
        <ThemeForm
          presets={Object.entries(THEME_PRESETS).map(([key, p]) => ({ key, label: p.label }))}
          current={current}
        />
      </div>
    </main>
  );
}
