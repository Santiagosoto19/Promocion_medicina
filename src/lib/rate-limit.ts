import { sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

// Ventana fija. Devuelve true si la acción está permitida, false si ya se superó el límite.
export async function hitRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const windowSeconds = Math.floor(windowMs / 1000);
  const rows = await db
    .insert(rateLimits)
    .values({ key, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE
          WHEN ${rateLimits.windowStart} < now() - make_interval(secs => ${windowSeconds})
          THEN 1
          ELSE ${rateLimits.count} + 1
        END`,
        windowStart: sql`CASE
          WHEN ${rateLimits.windowStart} < now() - make_interval(secs => ${windowSeconds})
          THEN now()
          ELSE ${rateLimits.windowStart}
        END`,
      },
    })
    .returning({ count: rateLimits.count });

  return (rows[0]?.count ?? 0) <= max;
}
