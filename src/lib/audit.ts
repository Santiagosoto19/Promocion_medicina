import { db } from "@/db";
import { auditLog } from "@/db/schema";

// Solo agrega filas. Ninguna acción del admin debería quedar sin registro.
export async function audit(input: {
  actor: string;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  await db.insert(auditLog).values({
    actor: input.actor,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    detail: input.detail,
    ip: input.ip,
  });
}
