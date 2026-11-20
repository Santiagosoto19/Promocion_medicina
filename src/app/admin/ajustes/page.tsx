import Link from "next/link";
import { getSettings } from "@/lib/access";
import { requireAdmin } from "@/lib/admin-session";
import { SettingsForm } from "./settings-form";

// Muestra la fecha en hora de Colombia para el campo datetime-local.
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const local = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default async function AjustesPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-xl space-y-8">
        <header>
          <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
          <h1 className="mt-2 page-title font-display text-3xl">Ajustes</h1>
        </header>
        <div className="paper-card p-5">
          <SettingsForm moderationRequired={settings.moderationRequired} ceremonyAt={toLocalInput(settings.ceremonyAt)} />
        </div>
      </div>
    </main>
  );
}
