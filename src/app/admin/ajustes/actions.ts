"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";
import { eq } from "drizzle-orm";

export type SettingsState = { error?: string; ok?: string } | undefined;

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const actor = await adminActor();
  const moderationRequired = formData.get("moderationRequired") === "on";
  // La fecha llega como hora local de Colombia (UTC-5) desde un campo datetime-local.
  const ceremonyRaw = String(formData.get("ceremonyAt") ?? "").trim();
  const ceremonyAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(ceremonyRaw) ? new Date(`${ceremonyRaw}:00-05:00`) : null;

  const update = { moderationRequired, ceremonyAt, updatedAt: new Date() };

  const current = await getSettings();
  await db.update(siteSettings).set(update).where(eq(siteSettings.id, 1));

  await audit({
    actor,
    action: "ajustes.guardados",
    entity: "site_settings",
    detail: {
      moderationRequired: { from: current.moderationRequired, to: moderationRequired },
    },
  });
  revalidatePath("/", "layout");
  revalidatePath("/subir");
  revalidatePath("/admin/ajustes");
  return { ok: "Ajustes guardados." };
}
