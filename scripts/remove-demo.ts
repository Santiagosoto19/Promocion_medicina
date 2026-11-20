// Borra solo los datos de ejemplo ([Demo]) y sus fotos en ImageKit. No toca datos reales.
import "./load-env";
import { and, eq, inArray, like } from "drizzle-orm";
import { db } from "../src/db";
import { capsuleLetters, guestbook, memories, students, teachers, timelineEvents } from "../src/db/schema";

const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY!;

async function deleteImageKit(fileId: string) {
  const res = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: `Basic ${Buffer.from(`${PRIVATE_KEY}:`).toString("base64")}` },
  });
  return res.status;
}

async function main() {
  const demoStudents = await db.select({ id: students.id }).from(students).where(like(students.slug, "demo-%"));
  const ids = demoStudents.map((s) => s.id);

  if (ids.length) {
    const photos = await db.select({ fileId: memories.imagekitFileId }).from(memories).where(and(inArray(memories.studentId, ids), eq(memories.storage, "imagekit")));
    for (const p of photos) if (p.fileId) console.log("ImageKit borrado:", p.fileId, await deleteImageKit(p.fileId));
    await db.delete(capsuleLetters).where(inArray(capsuleLetters.studentId, ids));
    await db.delete(memories).where(inArray(memories.studentId, ids));
    await db.delete(students).where(inArray(students.id, ids));
  }
  await db.delete(teachers).where(like(teachers.name, "[Demo]%"));
  await db.delete(timelineEvents).where(like(timelineEvents.title, "[Demo]%"));
  await db.delete(guestbook).where(like(guestbook.authorName, "[Demo]%"));

  console.log(`Datos de ejemplo borrados: ${ids.length} estudiantes y sus recuerdos.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
