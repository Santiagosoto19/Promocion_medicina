// ImageKit (fotos). Solo servidor: usa la clave privada.
import { getUploadAuthParams } from "@imagekit/next/server";
import { requireEnv } from "@/lib/env";

export { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_PHOTO_BYTES_HARD } from "@/lib/imagekit-limits";

// Autorización firmada para que el navegador suba directo a ImageKit. Vale 10 minutos.
export function imagekitUploadAuth() {
  return getUploadAuthParams({
    publicKey: requireEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY"),
    privateKey: requireEnv("IMAGEKIT_PRIVATE_KEY"),
    // El SDK espera una hora Unix absoluta (no segundos desde ahora): 10 minutos desde este momento.
    expire: Math.floor(Date.now() / 1000) + 600,
  });
}

function basicAuthHeader(): string {
  const key = requireEnv("IMAGEKIT_PRIVATE_KEY");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export type ImageKitFileDetails = {
  fileId: string;
  name: string;
  filePath: string;
  size: number;
  fileType: string;
  width?: number;
  height?: number;
};

// Consulta el archivo en ImageKit para verificar que existe y cumple lo permitido.
export async function getImageKitFile(fileId: string): Promise<ImageKitFileDetails | null> {
  const res = await fetch(
    `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}/details`,
    { headers: { Authorization: basicAuthHeader() }, cache: "no-store" },
  );
  if (!res.ok) return null;
  return (await res.json()) as ImageKitFileDetails;
}

export async function deleteImageKitFile(fileId: string): Promise<void> {
  await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: basicAuthHeader() },
  });
}
