// Cloudinary solo para videos y notas de voz. Solo servidor.
import { v2 as cloudinary } from "cloudinary";
import { requireEnv } from "@/lib/env";

let configured = false;

export function cloudinaryClient() {
  if (!configured) {
    cloudinary.config({
      cloud_name: requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
      api_key: requireEnv("CLOUDINARY_API_KEY"),
      api_secret: requireEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}
