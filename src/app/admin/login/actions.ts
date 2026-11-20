"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { startAdminSession } from "@/lib/admin-session";
import { audit } from "@/lib/audit";
import { hitRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string } | undefined;

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe la contraseña."),
});

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = await clientIp();

  const allowed = await hitRateLimit(`login:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!allowed) {
    await audit({ actor: "anonimo", action: "login.bloqueado", ip });
    return { error: "Demasiados intentos. Espera 15 minutos y vuelve a intentarlo." };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, parsed.data.email))
    .limit(1);

  const valid = admin ? await bcrypt.compare(parsed.data.password, admin.passwordHash) : false;
  if (!admin || !valid) {
    await audit({ actor: "anonimo", action: "login.fallido", detail: { email: parsed.data.email }, ip });
    return { error: "Correo o contraseña incorrectos." };
  }

  await startAdminSession(admin.id);
  await audit({ actor: admin.email, action: "login.ok", ip });
  redirect("/admin");
}
