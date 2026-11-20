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
  revalidatePath("/visitas");
  revalidatePath("/admin/visitas");
}
