// Crea o actualiza la única cuenta de administrador.
// Uso: npm run admin:create   (lee ADMIN_EMAIL y ADMIN_PASSWORD de .env.local o .env; la contraseña no se guarda en claro)
import "./load-env";
import bcrypt from "bcryptjs";
import { db } from "../src/db";
import { admins } from "../src/db/schema";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !email.includes("@")) throw new Error("Define ADMIN_EMAIL en .env.local.");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD debe tener al menos 12 caracteres.");

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .insert(admins)
    .values({ email, passwordHash })
    .onConflictDoUpdate({ target: admins.email, set: { passwordHash } });

  console.log(`Administrador listo: ${email}`);
  console.log("Ahora borra ADMIN_PASSWORD del archivo .env.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
