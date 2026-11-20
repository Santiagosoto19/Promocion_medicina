"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

// Guarda un texto editado directamente en la portada. Solo admin (requireAdmin dentro de adminActor).
export async function saveInlineText(field: "heroTitle" | "heroSubtitle", value: string): Promise<{ ok: boolean; error?: string }> {
  const actor = await adminActor();
  const clean = value.trim().slice(0, field === "heroTitle" ? 120 : 160);
  if (!clean) return { ok: false, error: "El texto no puede quedar vacío." };
  await db.update(siteSettings).set({ [field]: clean, updatedAt: new Date() }).where(eq(siteSettings.id, 1));
  await audit({ actor, action: "portada.texto", entity: "site_settings", detail: { field } });
  revalidatePath("/");
  return { ok: true };
}
