// URLs de entrega de Cloudinary (video y audio). Solo usa la variable pública del nombre de la nube.
function base(): string {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""}/video/upload`;
}

// Video convertido a MP4 de 720p como máximo (también convierte los .mov del iPhone).
export function videoSrc(publicId: string): string {
  return `${base()}/f_mp4,q_auto,w_1280/${publicId}.mp4`;
}

// Póster: fotograma del segundo 1.
export function videoPoster(publicId: string): string {
  return `${base()}/so_1,f_jpg,w_640/${publicId}.jpg`;
}

// Nota de voz convertida a MP3.
export function audioSrc(publicId: string): string {
  return `${base()}/f_mp3/${publicId}.mp3`;
}
