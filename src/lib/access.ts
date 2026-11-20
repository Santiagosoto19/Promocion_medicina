// Configuración del sitio (fila única).
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

export async function getSettings() {
  await db.insert(siteSettings).values({ id: 1 }).onConflictDoNothing();
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row!;
}

