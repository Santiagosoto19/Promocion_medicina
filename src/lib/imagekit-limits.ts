// Límites de fotos. Sin dependencias de servidor: se usan en el navegador y en el servidor.
export const MAX_PHOTO_BYTES = 500 * 1024; // lo que sube el navegador ya comprimido
export const MAX_PHOTO_BYTES_HARD = 600 * 1024; // tolerancia del servidor tras subir
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/webp"] as const;
