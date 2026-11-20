import { LiveView } from "./live-view";

export const dynamic = "force-dynamic";

// Pantalla para proyectar durante la ceremonia. Pública y sin controles: el admin llama a los estudiantes desde su panel.
export default function EnVivoPage() {
  return <LiveView siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""} />;
}
