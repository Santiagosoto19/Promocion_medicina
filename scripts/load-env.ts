// Carga las variables antes que cualquier otro módulo. Acepta .env.local o .env.
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });
