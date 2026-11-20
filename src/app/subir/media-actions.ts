"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { memories, students, uploadIntents } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/client-ip";
import { cloudinaryClient } from "@/lib/cloudinary";
import { requireEnv } from "@/lib/env";
import { ALLOWED_AUDIO_TYPES, ALLOWED_VIDEO_TYPES, MAX_MEDIA_SECONDS, MAX_VIDEO_BYTES } from "@/lib/media-limits";
import { hitRateLimit } from "@/lib/rate-limit";

const HOUR = 60 * 60 * 1000;
const MAX_MEDIA_PER_STUDENT_PER_HOUR = 10;
const MAX_MEDIA_PER_IP_PER_HOUR = 40;

const requestSchema = z.object({
  studentId: z.uuid(),
  kind: z.enum(["video", "audio"]),
  bytes: z.number().int().positive(),
  contentType: z.string().max(100),
});

const confirmSchema = z.object({
  intentId: z.uuid(),
  publicId: z.string().min(1).max(300),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().max(500).optional(),
});

export type MediaSignResult =
  | {
      ok: true;
      intentId: string;
      publicId: string;
      timestamp: number;
      signature: string;
      apiKey: string;
      cloudName: string;
    }
  | { ok: false; error: string };

// Firma la subida. Cloudinary exige firma del servidor; nunca se usan presets sin firma.
export async function requestMediaSignature(input: unknown): Promise<MediaSignResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Los datos del archivo no son válidos." };
  const { studentId, kind, bytes, contentType } = parsed.data;

  const allowed: readonly string[] = kind === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_AUDIO_TYPES;
  if (!allowed.includes(contentType)) return { ok: false, error: "Ese tipo de archivo no está permitido." };
  if (bytes > MAX_VIDEO_BYTES) return { ok: false, error: "El archivo pesa más de 100 MB. Recórtalo o usa una resolución menor." };

  const ip = await clientIp();
  if (!(await hitRateLimit(`media:ip:${ip}`, MAX_MEDIA_PER_IP_PER_HOUR, HOUR))) {
    return { ok: false, error: "Hay demasiadas subidas desde esta conexión. Intenta más tarde." };
  }
  if (!(await hitRateLimit(`media:student:${studentId}`, MAX_MEDIA_PER_STUDENT_PER_HOUR, HOUR))) {
    return { ok: false, error: "Has subido muchos archivos en esta hora. Intenta más tarde." };
  }

  const [student] = await db.select({ id: students.id }).from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return { ok: false, error: "No encontramos tu nombre en la lista." };

  const folder = kind === "video" ? "videos" : "notas";
  const publicId = `bata-blanca/${folder}/${studentId}/${randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const [intent] = await db
    .insert(uploadIntents)
    .values({ studentId, kind, storageKey: publicId, expectedBytes: bytes, contentType })
    .returning({ id: uploadIntents.id });

  const cloudinary = cloudinaryClient();
  const signature = cloudinary.utils.api_sign_request(
    { public_id: publicId, tags: "unconfirmed", timestamp },
    requireEnv("CLOUDINARY_API_SECRET"),
  );

  return {
    ok: true,
    intentId: intent.id,
    publicId,
    timestamp,
    signature,
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    cloudName: requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
  };
}

export type MediaConfirmResult = { ok: true; memoryId: string; status: "pending" | "approved" } | { ok: false; error: string };

// Verifica el archivo en Cloudinary antes de guardarlo: si no cumple, se borra.
export async function confirmMediaUpload(input: unknown): Promise<MediaConfirmResult> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Faltan datos para guardar el archivo." };
  const { intentId, publicId, title, body } = parsed.data;

  const ip = await clientIp();
  const [intent] = await db
    .select()
    .from(uploadIntents)
    .where(and(eq(uploadIntents.id, intentId), eq(uploadIntents.confirmed, false)))
    .limit(1);
  if (!intent) return { ok: false, error: "Esta subida ya fue guardada o no existe." };

  // Solo confiamos en el public_id que el servidor autorizó con esta intención.
  if (publicId !== intent.storageKey) {
    await audit({ actor: "sistema", action: "subida.media_no_coincide", ip, detail: { intentId } });
    return { ok: false, error: "No pudimos verificar el archivo. Intenta de nuevo." };
  }

  const cloudinary = cloudinaryClient();
  let resource: { bytes?: number; duration?: number; width?: number; height?: number } | null = null;
  try {
    // media_metadata: sin esta opción Cloudinary no devuelve la duración.
    resource = await cloudinary.api.resource(publicId, { resource_type: "video", media_metadata: true });
  } catch {
    resource = null;
  }
  if (!resource) return { ok: false, error: "El archivo todavía no llegó a Cloudinary. Intenta de nuevo." };

  const duration = Number(resource.duration ?? 0);
  const bytes = Number(resource.bytes ?? 0);
  const kind = intent.kind === "audio" ? "audio" : "video";
  if (bytes > MAX_VIDEO_BYTES || duration > MAX_MEDIA_SECONDS || duration <= 0) {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video", invalidate: true });
    await audit({
      actor: "sistema",
      action: "subida.media_rechazada",
      ip,
      detail: { intentId, bytes, duration },
    });
    return {
      ok: false,
      error: duration > MAX_MEDIA_SECONDS
        ? `Dura más de ${MAX_MEDIA_SECONDS} segundos. Recórtalo desde la galería del celular.`
        : "El archivo pesa demasiado o no se pudo leer.",
    };
  }

  // Quita la etiqueta de "sin confirmar" (así la limpieza diaria no lo borra).
  await cloudinary.uploader.remove_tag("unconfirmed", [publicId], { resource_type: "video" });

  const settings = await getSettings();
  const status = settings.moderationRequired ? "pending" : "approved";

  const [memory] = await db
    .insert(memories)
    .values({
      studentId: intent.studentId,
      type: kind,
      storage: "cloudinary",
      cloudinaryPublicId: publicId,
      durationS: Math.round(duration),
      bytes,
      width: resource.width ?? null,
      height: resource.height ?? null,
      title: title || null,
      body: body || null,
      status,
      moderatedAt: status === "approved" ? new Date() : null,
    })
    .returning({ id: memories.id });

  await db.update(uploadIntents).set({ confirmed: true }).where(eq(uploadIntents.id, intentId));
  await audit({
    actor: "estudiante",
    action: "recuerdo.subido",
    entity: "memories",
    entityId: memory.id,
    ip,
    detail: { studentId: intent.studentId, type: kind, status },
  });

  revalidatePath("/");
  revalidatePath("/admin/moderacion");
  return { ok: true, memoryId: memory.id, status };
}
