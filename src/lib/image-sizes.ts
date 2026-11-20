// Tamaños de visualización. Siempre por transformación de URL: el original nunca se sirve en mosaico ni galería.
// Sintaxis de transformaciones de ImageKit: verificar en la documentación actual si se cambia algo.
export const IMAGE_SIZES = {
  thumb: "w-400,h-400,c-at_least,fo-center", // mosaico y fotomosaico (cuadrado centrado)
  gallery: "w-1080,c-at_max", // galería
  lightbox: "w-1920,c-at_max", // lightbox y exportación
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

// Usa solo la variable pública del endpoint; se puede llamar desde servidor y navegador.
export function imageUrl(filePath: string, size: ImageSize): string {
  const endpoint = (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "").replace(/\/$/, "");
  const path = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${endpoint}${path}?tr=${IMAGE_SIZES[size]}`;
}
