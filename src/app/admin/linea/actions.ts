"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { timelineEvents } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";

const schema = z.object({
  title: z.string().trim().min(2, "Escribe un título.").max(120),
  eventDate: z.string().trim().max(60).optional(),
  description: z.string().trim().max(400).optional(),
  orderIndex: z.coerce.number().int().min(0).max(9999),
});

export type EventState = { ok?: boolean; error?: string } | undefined;

export async function addEvent(_prev: EventState, formData: FormData): Promise<EventState> {
  const actor = await adminActor();
  const parsed = schema.safeParse({
    title: formData.get("title"),
    eventDate: formData.get("eventDate") || undefined,
    description: formData.get("description") || undefined,
    orderIndex: formData.get("orderIndex") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const [created] = await db
    .insert(timelineEvents)
    .values({ ...parsed.data, eventDate: parsed.data.eventDate || null, description: parsed.data.description || null })
    .returning({ id: timelineEvents.id });
  await audit({ actor, action: "linea.agregado", entity: "timeline_events", entityId: created.id, detail: { title: parsed.data.title } });
  revalidatePath("/linea");
  revalidatePath("/admin/linea");
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<void> {
  const actor = await adminActor();
  const [removed] = await db.delete(timelineEvents).where(eq(timelineEvents.id, id)).returning({ title: timelineEvents.title });
  await audit({ actor, action: "linea.eliminado", entity: "timeline_events", entityId: id, detail: { title: removed?.title } });
  revalidatePath("/linea");
  revalidatePath("/admin/linea");
}
