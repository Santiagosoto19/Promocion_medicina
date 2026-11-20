"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";
import { HEX, THEME_PRESETS, type ThemeColors } from "@/lib/themes";

export type ThemeState = { ok?: boolean; error?: string } | undefined;

export async function saveTheme(_prev: ThemeState, formData: FormData): Promise<ThemeState> {
  const actor = await adminActor();
  const preset = String(formData.get("preset") ?? "clinico");

  let colors: ThemeColors;
  if (preset in THEME_PRESETS) {
    const p = THEME_PRESETS[preset as keyof typeof THEME_PRESETS];
    colors = { primary: p.primary, secondary: p.secondary, gold: p.gold, rose: p.rose };
  } else {
    const keys = ["primary", "secondary", "gold", "rose"] as const;
    const values = keys.map((k) => String(formData.get(k) ?? ""));
    if (!values.every((v) => HEX.test(v))) return { error: "Los colores deben tener formato #RRGGBB." };
    colors = Object.fromEntries(keys.map((k, i) => [k, values[i]])) as ThemeColors;
  }

  await db.update(siteSettings).set({ theme: colors, updatedAt: new Date() }).where(eq(siteSettings.id, 1));
  await audit({ actor, action: "tema.guardado", entity: "site_settings", detail: { preset } });
  revalidatePath("/", "layout");
  return { ok: true };
}
