"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

export async function saveOath(_prev: { ok?: boolean; error?: string } | undefined, formData: FormData) {
  const actor = await adminActor();
  const text = String(formData.get("oathText") ?? "").replace(/\r\n/g, "\n").trim();
  if (text.length > 5000) return { error: "El juramento es demasiado largo (máximo 5000 caracteres)." };

  await db.update(siteSettings).set({ oathText: text || null, updatedAt: new Date() }).where(eq(siteSettings.id, 1));
  await audit({ actor, action: "juramento.guardado", entity: "site_settings", detail: { longitud: text.length } });
  revalidatePath("/juramento");
  return { ok: true };
}
