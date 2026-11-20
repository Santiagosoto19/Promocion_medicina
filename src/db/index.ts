import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL en las variables de entorno.");
  return url;
}

// El navegador nunca se conecta a la base de datos: solo el servidor usa este cliente.
export const db = drizzle(neon(getDatabaseUrl()), { schema });
