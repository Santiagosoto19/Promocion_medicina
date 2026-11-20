import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { memories, guestbook } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { isAdminRequest } from "@/lib/admin-session";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

// Solo con sesión de admin se muestra el marco con contadores. El login va sin marco.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminRequest())) return <>{children}</>;

  const [[{ pendientes }], [{ visitas }], settings] = await Promise.all([
    db.select({ pendientes: count() }).from(memories).where(eq(memories.status, "pending")),
    db.select({ visitas: count() }).from(guestbook).where(eq(guestbook.status, "pending")),
    getSettings(),
  ]);
  const ceremonia = settings.ceremonyAt ?? new Date("2026-12-05T08:00:00-05:00");
  const diasCeremonia = Math.ceil((ceremonia.getTime() - Date.now()) / 86_400_000);

  return (
    <AdminShell counts={{ pendientes: Number(pendientes), visitas: Number(visitas), diasCeremonia: diasCeremonia > 0 ? diasCeremonia : 0 }}>
      {children}
    </AdminShell>
  );
}
