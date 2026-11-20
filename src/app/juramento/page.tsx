import { PageShell } from "@/components/page-shell";
import { getSettings } from "@/lib/access";
import { OathReveal } from "./oath-reveal";

export const dynamic = "force-dynamic";

export default async function JuramentoPage() {
  const settings = await getSettings();
  const lines = (settings.oathText ?? "").split(/\r?\n/);

  return (
    <PageShell eyebrow="Ceremonia" title="El juramento" lede="Lee cada línea mientras bajas." width="max-w-2xl">
      <div className="paper-card p-8 sm:p-12">
        {settings.oathText ? (
          <OathReveal lines={lines} />
        ) : (
          <p className="font-hand text-2xl text-primary">El juramento se publicará pronto.</p>
        )}
      </div>
    </PageShell>
  );
}
