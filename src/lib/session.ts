// Edge-safe: se usa en middleware.ts, así que no importa nada de next/headers.
import { jwtVerify, SignJWT } from "jose";

export const ADMIN_COOKIE = "bb_admin";
export const SESSION_MAX_AGE_S = 60 * 60 * 12; // 12 horas

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET debe existir y tener al menos 32 caracteres.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(adminId: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_S}s`)
    .sign(secretKey());
}

// Devuelve el id del admin si la sesión es válida; si no, null.
export async function verifySession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.role !== "admin" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
