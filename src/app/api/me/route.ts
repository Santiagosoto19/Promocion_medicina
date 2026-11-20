import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";

// ¿Quien mira es el admin? Respuesta privada y sin caché, para que la portada pueda guardarse en caché
// y solo active la edición en el navegador de quien tiene sesión.
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await isAdminRequest();
  return NextResponse.json({ admin }, { headers: { "Cache-Control": "private, no-store" } });
}
