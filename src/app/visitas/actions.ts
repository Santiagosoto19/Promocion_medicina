"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { guestbook } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/client-ip";
import { hitRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  authorName: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  relationship: z.string().trim().max(60).optional(),
  body: z.string().trim().min(3, "Escribe un mensaje.").max(600),
});

export async function signGuestbook(input: unknown): Promise<{ ok: true; status: "pending" | "approved" } | { ok: false; error: string }> {
  const settings = await getSettings();
  if (!settings.guestsEnabled) return { ok: false, error: "El libro de visitas no está abierto." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa el mensaje." };

  const ip = await clientIp();
  if (!(await hitRateLimit(`visita:ip:${ip}`, 10, 60 * 60 * 1000))) return { ok: false, error: "Demasiados mensajes desde esta conexión." };

  // Los invitados siempre pasan por moderación.
  const [row] = await db
    .insert(guestbook)
    .values({ authorName: parsed.data.authorName, relationship: parsed.data.relationship || null, body: parsed.data.body, status: "pending" })
    .returning({ id: guestbook.id });
  await audit({ actor: "invitado", action: "visita.guardada", entity: "guestbook", entityId: row.id, ip });
  revalidatePath("/", "layout");
  revalidatePath("/admin/visitas");
  return { ok: true, status: "pending" };
}
