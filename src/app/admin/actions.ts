"use server";

import { redirect } from "next/navigation";
import { endAdminSession, requireAdmin } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

export async function logoutAction(): Promise<void> {
  const adminEmail = await requireAdmin().catch(() => null);
  await endAdminSession();
  await audit({ actor: adminEmail ?? "anonimo", action: "logout" });
  redirect("/admin/login");
}
