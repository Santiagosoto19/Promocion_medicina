"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { memories } from "@/db/schema";
import { adminActor } from "@/lib/admin-session";
import { audit } from "@/lib/audit";
import { cloudinaryClient } from "@/lib/cloudinary";
import { deleteImageKitFile } from "@/lib/imagekit";

// Borrado definitivo y explícito de una publicación (foto, video, audio, mensaje o firma).
// Primero se borra el archivo del almacenamiento; si eso falla, el registro se conserva para reintentar.
// Los emojis de reacción se borran en cascada.
export async function deleteMemory(id: string): Promise<{ ok: boolean; error?: string }> {
  const actor = await adminActor();
  const [current] = await db
    .select({
      type: memories.type,
      storage: memories.storage,
      imagekitFileId: memories.imagekitFileId,
      cloudinaryPublicId: memories.cloudinaryPublicId,
      studentId: memories.studentId,
    })
    .from(memories)
    .where(eq(memories.id, id))
    .limit(1);
  if (!current) return { ok: false, error: "Esa publicación ya no existe." };

  try {
    if (current.storage === "imagekit" && current.imagekitFileId) {
      await deleteImageKitFile(current.imagekitFileId);
    } else if (current.storage === "cloudinary" && current.cloudinaryPublicId) {
      const resourceType = current.type === "video" || current.type === "audio" ? "video" : "image";
      await cloudinaryClient().uploader.destroy(current.cloudinaryPublicId, { resource_type: resourceType, invalidate: true });
    }
  } catch {
    return { ok: false, error: "No se pudo borrar el archivo en el almacenamiento. Intenta de nuevo; la publicación no se borró." };
  }

  await db.delete(memories).where(eq(memories.id, id));

  await audit({
    actor,
    action: "recuerdo.eliminado",
    entity: "memories",
    entityId: id,
    detail: { type: current.type, studentId: current.studentId, storage: current.storage },
  });
  revalidatePath("/");
  revalidatePath("/galeria");
  revalidatePath("/admin/moderacion");
  return { ok: true };
}

export async function setMemoryStatus(id: string, status: "approved" | "hidden" | "pending"): Promise<void> {
  const actor = await adminActor();
  const [current] = await db.select({ status: memories.status }).from(memories).where(eq(memories.id, id)).limit(1);
  if (!current) return;

  await db
    .update(memories)
    .set({ status, moderatedAt: status === "pending" ? null : new Date() })
    .where(eq(memories.id, id));

  await audit({
    actor,
    action: "recuerdo.estado",
    entity: "memories",
    entityId: id,
    detail: { from: current.status, to: status },
  });
  revalidatePath("/");
  revalidatePath("/admin/moderacion");
}
