"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

export type ContentState = { ok?: boolean; error?: string } | undefined;

const playlistSchema = z.string().trim().max(300).refine(
  (v) => v === "" || /^https:\/\/(open\.spotify\.com\/playlist\/[A-Za-z0-9]+|(www\.)?youtube\.com\/playlist\?list=[\w-]+)/.test(v),
  "La playlist debe ser un enlace de Spotify o YouTube.",
);

export async function saveContent(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const actor = await adminActor();
  const playlist = playlistSchema.safeParse(String(formData.get("playlistUrl") ?? ""));
  if (!playlist.success) return { error: playlist.error.issues[0]?.message ?? "Revisa la playlist." };

  const capsuleRaw = String(formData.get("capsuleOpenAt") ?? "").trim();
  const capsuleOpenAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(capsuleRaw) ? new Date(`${capsuleRaw}:00-05:00`) : null;
  const target = String(formData.get("mosaicTargetPath") ?? "").trim();

  await db
    .update(siteSettings)
    .set({
      heroTitle: String(formData.get("heroTitle") ?? "").trim().slice(0, 120) || null,
      heroSubtitle: String(formData.get("heroSubtitle") ?? "").trim().slice(0, 160) || null,
      playlistUrl: playlist.data || null,
      guestsEnabled: formData.get("guestsEnabled") === "on",
      capsuleOpenAt,
      mosaicTargetPath: target.startsWith("/bata-blanca/") ? target : null,
      updatedAt: new Date(),
    })
    .where(eq(siteSettings.id, 1));

  await audit({ actor, action: "contenido.guardado", entity: "site_settings" });
  revalidatePath("/", "layout");
  return { ok: true };
}
