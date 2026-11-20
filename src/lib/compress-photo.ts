// Solo navegador. Redibuja la foto en canvas: corrige la orientación, elimina metadatos (GPS) y reduce el tamaño.
import { MAX_PHOTO_BYTES } from "@/lib/imagekit-limits";

export type CompressedPhoto = {
  blob: Blob;
  contentType: "image/webp" | "image/jpeg";
  width: number;
  height: number;
};

// Convierte HEIC (iPhone) a JPEG antes de comprimir. Se carga solo si hace falta.
async function toBrowserImage(file: File): Promise<Blob> {
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  return Array.isArray(result) ? result[0] : result;
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  const source = await toBrowserImage(file);
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });

  // Dos intentos: 2048 px y, si no alcanza el peso, 1600 px.
  for (const maxSide of [2048, 1600]) {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Tu navegador no pudo procesar la imagen.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    for (const quality of [0.85, 0.75, 0.65, 0.55]) {
      let blob = await encode(canvas, "image/webp", quality);
      let contentType: CompressedPhoto["contentType"] = "image/webp";
      if (!blob) {
        blob = await encode(canvas, "image/jpeg", quality);
        contentType = "image/jpeg";
      }
      if (blob && blob.size <= MAX_PHOTO_BYTES) {
        bitmap.close();
        return { blob, contentType, width, height };
      }
    }
  }

  bitmap.close();
  throw new Error("No logramos reducir la foto lo suficiente. Prueba con otra imagen.");
}
