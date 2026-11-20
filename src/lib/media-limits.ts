// Límites de video y notas de voz. Compartido por navegador y servidor.
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_MEDIA_SECONDS = 60;
export const CHUNK_BYTES = 6 * 1024 * 1024; // Cloudinary pide trozos de al menos 5 MB, salvo el último

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
export const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/ogg", "audio/wav"] as const;
