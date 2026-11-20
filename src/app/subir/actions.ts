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
import { requireEnv } from "@/lib/env";
import {
  ALLOWED_PHOTO_TYPES,
  deleteImageKitFile,
  getImageKitFile,
  imagekitUploadAuth,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_BYTES_HARD,
} from "@/lib/imagekit";
import { hitRateLimit } from "@/lib/rate-limit";

const HOUR = 60 * 60 * 1000;
const MAX_UPLOADS_PER_STUDENT_PER_HOUR = 40;
const MAX_UPLOADS_PER_IP_PER_HOUR = 120;

const requestSchema = z.object({
  studentId: z.uuid(),
  bytes: z.number().int().positive(),
  contentType: z.enum(ALLOWED_PHOTO_TYPES),
});

const confirmSchema = z.object({
  intentId: z.uuid(),
  fileId: z.string().min(1).max(200),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().max(500).optional(),
});

export type UploadAuthResult =
  | {
      ok: true;
      intentId: string;
      token: string;
      signature: string;
      expire: number;
      publicKey: string;
      folder: string;
      fileName: string;
    }
  | { ok: false; error: string };

export async function requestPhotoUpload(input: unknown): Promise<UploadAuthResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Los datos de la foto no son válidos." };
  const { studentId, bytes, contentType } = parsed.data;

  const ip = await clientIp();
  if (!(await hitRateLimit(`upload:ip:${ip}`, MAX_UPLOADS_PER_IP_PER_HOUR, HOUR))) {
    return { ok: false, error: "Hay demasiadas subidas desde esta conexión. Intenta más tarde." };
  }
  if (!(await hitRateLimit(`upload:student:${studentId}`, MAX_UPLOADS_PER_STUDENT_PER_HOUR, HOUR))) {
    return { ok: false, error: "Has subido muchas fotos en esta hora. Intenta más tarde." };
  }

  if (bytes > MAX_PHOTO_BYTES) {
    return { ok: false, error: "La foto es demasiado grande. Intenta con otra o con menos resolución." };
  }

  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  if (!student) return { ok: false, error: "No encontramos tu nombre en la lista." };

  const ext = contentType === "image/webp" ? "webp" : "jpg";
  const folder = `/bata-blanca/fotos/${studentId}`;
  const fileName = `${randomUUID()}.${ext}`;

  const [intent] = await db
    .insert(uploadIntents)
    .values({
      studentId,
      kind: "photo",
      storageKey: `${folder}/${fileName}`,
      expectedBytes: bytes,
      contentType,
    })
    .returning({ id: uploadIntents.id });

  const auth = imagekitUploadAuth();
  return {
    ok: true,
    intentId: intent.id,
    token: auth.token,
    signature: auth.signature,
    expire: auth.expire,
    publicKey: requireEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY"),
    folder,
    fileName,
  };
}

export type ConfirmResult = { ok: true; memoryId: string; status: "pending" | "approved" } | { ok: false; error: string };

export async function confirmPhotoUpload(input: unknown): Promise<ConfirmResult> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Faltan datos para guardar la foto." };
  const { intentId, fileId, width, height, title, body } = parsed.data;

  const ip = await clientIp();

  const [intent] = await db
    .select()
    .from(uploadIntents)
    .where(and(eq(uploadIntents.id, intentId), eq(uploadIntents.confirmed, false)))
    .limit(1);
  if (!intent) return { ok: false, error: "Esta subida ya fue guardada o no existe." };

  // Si el archivo no es el que se autorizó con esta intención, se rechaza sin borrar nada:
  // podría ser de otra persona.
  const file = await getImageKitFile(fileId);
  if (!file || file.filePath !== intent.storageKey) {
    await audit({ actor: "sistema", action: "subida.archivo_no_coincide", ip, detail: { intentId } });
    return { ok: false, error: "No pudimos verificar la foto. Intenta de nuevo." };
  }

  // Esta intención sí es nuestra: si no cumple, se borra del almacenamiento.
  if (file.fileType !== "image" || file.size > MAX_PHOTO_BYTES_HARD) {
    await deleteImageKitFile(fileId);
    await audit({
      actor: "sistema",
      action: "subida.rechazada",
      ip,
      detail: { intentId, fileType: file.fileType, size: file.size },
    });
    return { ok: false, error: "El archivo no es una foto válida o pesa demasiado." };
  }

  const settings = await getSettings();
  const status = settings.moderationRequired ? "pending" : "approved";

  const [memory] = await db
    .insert(memories)
    .values({
      studentId: intent.studentId,
      type: "photo",
      storage: "imagekit",
      imagekitFileId: fileId,
      imagekitFilePath: file.filePath,
      bytes: file.size,
      width: width ?? file.width ?? null,
      height: height ?? file.height ?? null,
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
    detail: { studentId: intent.studentId, status },
  });

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/moderacion");
  return { ok: true, memoryId: memory.id, status };
}
