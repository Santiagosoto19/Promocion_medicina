// Configuración del sitio (fila única).
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

// Lee primero: solo escribe la fila la primera vez. Antes insertaba en cada visita.
// cache() evita repetir la consulta dentro de la misma petición.
export const getSettings = cache(async () => {
  const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  if (existing) return existing;
  await db.insert(siteSettings).values({ id: 1 }).onConflictDoNothing();
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row!;
});

