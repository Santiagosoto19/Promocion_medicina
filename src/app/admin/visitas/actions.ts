"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { guestbook } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

export async function setGuestStatus(id: string, status: "approved" | "hidden"): Promise<void> {
  const actor = await adminActor();
  await db.update(guestbook).set({ status }).where(eq(guestbook.id, id));
  await audit({ actor, action: "visita.estado", entity: "guestbook", entityId: id, detail: { status } });
  revalidatePath("/", "layout");
  revalidatePath("/visitas");
  revalidatePath("/admin/visitas");
}

// Borrado definitivo de una visita del libro. Se registra en auditoría.
export async function deleteGuestEntry(id: string): Promise<void> {
  const actor = await adminActor();
  const [removed] = await db.delete(guestbook).where(eq(guestbook.id, id)).returning({ authorName: guestbook.authorName });
  if (!removed) return;
  await audit({ actor, action: "visita.eliminada", entity: "guestbook", entityId: id, detail: { authorName: removed.authorName } });
  revalidatePath("/", "layout");
  revalidatePath("/visitas");
  revalidatePath("/admin/visitas");
}
