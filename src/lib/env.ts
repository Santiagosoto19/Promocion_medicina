// Lectura de variables de entorno del servidor. Los secretos nunca usan el prefijo NEXT_PUBLIC_.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}
