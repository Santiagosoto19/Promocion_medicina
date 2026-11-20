"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { awards } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

export type AwardState = { ok?: boolean; error?: string } | undefined;

export async function addAward(_prev: AwardState, formData: FormData): Promise<AwardState> {
  const actor = await adminActor();
  const parsed = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().max(200).optional() }).safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: "Escribe el nombre de la categoría." };
  const [row] = await db.insert(awards).values({ title: parsed.data.title, description: parsed.data.description || null }).returning({ id: awards.id });
  await audit({ actor, action: "premio.creado", entity: "awards", entityId: row.id, detail: { title: parsed.data.title } });
  revalidatePath("/", "layout");
  revalidatePath("/premios");
  revalidatePath("/admin/premios");
  return { ok: true };
}

// Estados: open (votar) → closed (cerrada) → revealed (ganador visible).
export async function setAwardStatus(id: string, status: "open" | "closed" | "revealed"): Promise<void> {
  const actor = await adminActor();
  await db.update(awards).set({ status }).where(eq(awards.id, id));
  await audit({ actor, action: "premio.estado", entity: "awards", entityId: id, detail: { status } });
  revalidatePath("/", "layout");
  revalidatePath("/premios");
  revalidatePath("/admin/premios");
}
