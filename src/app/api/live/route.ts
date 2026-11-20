import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { videoPoster, videoSrc } from "@/lib/cloudinary-url";
import { imageUrl } from "@/lib/image-sizes";

export const dynamic = "force-dynamic";

// Datos para el modo ceremonia. Solo recuerdos aprobados de foto y video; sin datos sensibles.
export async function GET() {
  const settings = await getSettings();

  const rows = await db
    .select({
      id: memories.id,
      type: memories.type,
      title: memories.title,
      path: memories.imagekitFilePath,
      publicId: memories.cloudinaryPublicId,
      studentName: students.fullName,
      nickname: students.nickname,
    })
    .from(memories)
    .innerJoin(students, eq(students.id, memories.studentId))
    .where(and(eq(memories.status, "approved"), ne(memories.type, "signature"), ne(memories.type, "audio")))
    .orderBy(desc(memories.createdAt))
    .limit(30);

  const items = rows.map((r) =>
    r.type === "video" && r.publicId
      ? { id: r.id, kind: "video" as const, src: videoSrc(r.publicId), poster: videoPoster(r.publicId), title: r.title, studentName: r.studentName, nickname: r.nickname }
      : r.path
        ? { id: r.id, kind: "photo" as const, src: imageUrl(r.path, "lightbox"), poster: null, title: r.title, studentName: r.studentName, nickname: r.nickname }
        : null,
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  let call: { fullName: string; nickname: string | null; quote: string | null } | null = null;
  if (settings.liveCallStudentId) {
    const [s] = await db
      .select({ fullName: students.fullName, nickname: students.nickname, quote: students.quote })
      .from(students)
      .where(eq(students.id, settings.liveCallStudentId))
      .limit(1);
    call = s ?? null;
  }

  return Response.json(
    { items, call },
    { headers: { "Cache-Control": "no-store" } },
  );
}
