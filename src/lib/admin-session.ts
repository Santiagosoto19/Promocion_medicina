// Server-only: usa next/headers y cookies de la petición.
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { ADMIN_COOKIE, SESSION_MAX_AGE_S, signSession, verifySession } from "@/lib/session";

export async function startAdminSession(adminId: string): Promise<void> {
  const token = await signSession(adminId);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function endAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

// Úsala al inicio de cada Server Action o página de admin. Redirige si no hay sesión.
export async function requireAdmin(): Promise<string> {
  const jar = await cookies();
  const adminId = await verifySession(jar.get(ADMIN_COOKIE)?.value);
  if (!adminId) redirect("/admin/login");
  return adminId;
}

// Correo del admin actual, para la auditoría.
export async function adminActor(): Promise<string> {
  const adminId = await requireAdmin();
  const [row] = await db
    .select({ email: admins.email })
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);
  return row?.email ?? "admin";
}

// ¿Hay un admin con sesión? No redirige: sirve para mostrar controles de edición en páginas públicas.
export async function isAdminRequest(): Promise<boolean> {
  const jar = await cookies();
  return (await verifySession(jar.get(ADMIN_COOKIE)?.value)) !== null;
}
