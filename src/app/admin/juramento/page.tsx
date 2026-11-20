import Link from "next/link";
import { getSettings } from "@/lib/access";
import { requireAdmin } from "@/lib/admin-session";
import { saveOath } from "./actions";
import { OathForm } from "./oath-form";

export default async function JuramentoAdmin() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <main className="min-h-dvh bg-paper px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">← Panel</Link>
        <h1 className="page-title font-display text-3xl">Juramento</h1>
        <p className="text-sm text-muted">Pega aquí el texto que van a usar en la ceremonia. Cada línea se mostrará al hacer scroll.</p>
        <OathForm action={saveOath} initial={settings.oathText ?? ""} />
      </div>
    </main>
  );
}
