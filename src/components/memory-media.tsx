import Image from "next/image";
import { audioSrc, videoPoster, videoSrc } from "@/lib/cloudinary-url";
import { imageUrl } from "@/lib/image-sizes";
import { SignatureStrokes } from "@/components/signature-strokes";

type Props = {
  type: "photo" | "video" | "audio" | "message" | "signature";
  path: string | null;
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string;
  data?: string | null;
};

// Muestra el recuerdo según su tipo. Las fotos usan el tamaño de galería; videos y audios se cargan solo al pulsar play.
export function MemoryMedia({ type, path, publicId, width, height, alt, data }: Props) {
  if (type === "signature") {
    return (
      <div className="p-6">
        <SignatureStrokes data={data ?? null} className="mx-auto h-auto w-full max-w-xs" />
      </div>
    );
  }
  if (type === "photo" && path) {
    return (
      <Image
        src={imageUrl(path, "gallery")}
        alt={alt}
        width={540}
        height={Math.round((540 * (height ?? 1)) / (width ?? 1))}
        unoptimized
        className="h-auto w-full"
      />
    );
  }
  if (type === "video" && publicId) {
    return (
      <video
        src={videoSrc(publicId)}
        poster={videoPoster(publicId)}
        controls
        preload="none"
        playsInline
        aria-label={alt}
        // La proporción real del video evita que se vea como una franja antes de reproducirse;
        // object-contain muestra videos verticales completos, sin estirarlos ni recortarlos.
        style={{ aspectRatio: width && height ? `${width} / ${height}` : "16 / 9" }}
        className="w-full bg-black object-contain"
      />
    );
  }
  if (type === "audio" && publicId) {
    return (
      <div className="p-3">
        <audio src={audioSrc(publicId)} controls preload="none" aria-label={alt} className="w-full" />
      </div>
    );
  }
  return null;
}
