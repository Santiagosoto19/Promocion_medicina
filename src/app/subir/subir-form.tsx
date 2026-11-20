"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { compressPhoto } from "@/lib/compress-photo";
import { CHUNK_BYTES, MAX_MEDIA_SECONDS, MAX_VIDEO_BYTES } from "@/lib/media-limits";
import { confirmPhotoUpload, requestPhotoUpload } from "./actions";
import { confirmMediaUpload, requestMediaSignature } from "./media-actions";

type StudentOption = { id: string; fullName: string; nickname: string | null };

type FileState = {
  name: string;
  status: "esperando" | "subiendo" | "guardada" | "error";
  progress: number;
  message?: string;
};

const STORAGE_KEY = "bb:subida";

// Recuerda en este navegador quién eres (solo comodidad).
function readSavedStudent(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveStudent(studentId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, studentId);
  } catch {
    // Sin almacenamiento local, simplemente no se recuerda.
  }
}

function isPhoto(file: File): boolean {
  return file.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name);
}

function isMedia(file: File): boolean {
  return file.type.startsWith("video/") || file.type.startsWith("audio/") || /\.(mp4|mov|webm|m4a|mp3|wav|ogg)$/i.test(file.name);
}

// Algunos celulares no envían el tipo del archivo: se deduce por la extensión.
function mediaType(file: File): { kind: "video" | "audio"; contentType: string } | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExt: Record<string, { kind: "video" | "audio"; contentType: string }> = {
    mp4: { kind: "video", contentType: "video/mp4" },
    mov: { kind: "video", contentType: "video/quicktime" },
    webm: { kind: "video", contentType: "video/webm" },
    m4a: { kind: "audio", contentType: "audio/x-m4a" },
    mp3: { kind: "audio", contentType: "audio/mpeg" },
    wav: { kind: "audio", contentType: "audio/wav" },
    ogg: { kind: "audio", contentType: "audio/ogg" },
  };
  if (file.type.startsWith("video/")) return { kind: "video", contentType: file.type };
  if (file.type.startsWith("audio/")) return { kind: "audio", contentType: file.type };
  return byExt[ext] ?? null;
}

function readDuration(file: File, kind: "video" | "audio"): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(kind === "video" ? "video" : "audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(el.duration);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No pudimos leer la duración del archivo. Prueba con otro formato o recórtalo."));
    };
    el.src = url;
  });
}

function uploadPhotoToImageKit(
  file: Blob,
  auth: { publicKey: string; signature: string; expire: number; token: string; folder: string; fileName: string },
  onProgress: (pct: number) => void,
): Promise<{ fileId: string; filePath: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, auth.fileName);
    form.append("fileName", auth.fileName);
    form.append("folder", auth.folder);
    form.append("publicKey", auth.publicKey);
    form.append("signature", auth.signature);
    form.append("expire", String(auth.expire));
    form.append("token", auth.token);
    // El nombre ya es un UUID único: que ImageKit no le añada sufijo, para que la ruta coincida con la autorizada.
    form.append("useUniqueFileName", "false");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data: { fileId?: string; filePath?: string; message?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // Respuesta no JSON: se reporta abajo con el código.
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.fileId) {
        resolve({ fileId: data.fileId, filePath: data.filePath ?? "" });
      } else {
        reject(new Error(`ImageKit respondió ${xhr.status}${data.message ? `: ${data.message}` : ""}.`));
      }
    };
    xhr.onerror = () => reject(new Error("El navegador no pudo conectarse con ImageKit (posible bloqueo de dominio o de red)."));
    xhr.send(form);
  });
}

// Cloudinary: archivos pequeños en una sola petición; los grandes en trozos de 6 MB.
async function uploadMediaToCloudinary(
  file: File,
  auth: { publicId: string; timestamp: number; signature: string; apiKey: string; cloudName: string },
  onProgress: (pct: number) => void,
): Promise<void> {
  const url = `https://api.cloudinary.com/v1_1/${auth.cloudName}/video/upload`;
  const total = file.size;
  const uniqueId = crypto.randomUUID();

  const sendChunk = async (blob: Blob, start: number, end: number) => {
    const form = new FormData();
    form.append("file", blob, file.name);
    form.append("api_key", auth.apiKey);
    form.append("timestamp", String(auth.timestamp));
    form.append("public_id", auth.publicId);
    form.append("tags", "unconfirmed");
    form.append("signature", auth.signature);

    const headers: Record<string, string> = {};
    if (total > CHUNK_BYTES) {
      headers["X-Unique-Upload-Id"] = uniqueId;
      headers["Content-Range"] = `bytes ${start}-${end - 1}/${total}`;
    }
    const res = await fetch(url, { method: "POST", headers, body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`Cloudinary respondió ${res.status}${data?.error?.message ? `: ${data.error.message}` : ""}.`);
    }
  };

  if (total <= CHUNK_BYTES) {
    onProgress(10);
    await sendChunk(file, 0, total);
    onProgress(100);
    return;
  }

  let start = 0;
  while (start < total) {
    const end = Math.min(start + CHUNK_BYTES, total);
    await sendChunk(file.slice(start, end), start, end);
    start = end;
    onProgress(Math.round((end / total) * 100));
  }
}

export function SubirForm({ students }: { students: StudentOption[] }) {
  const [studentId, setStudentId] = useState(() => (typeof window !== "undefined" ? readSavedStudent() : ""));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dragging, setDragging] = useState(false);
  const { avisar } = useToast();
  const [files, setFiles] = useState<FileState[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function celebrate() {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ["#0E7C86", "#C9A227", "#F4A7B9"] });
    } catch {
      // Sin confeti no pasa nada.
    }
  }

  function setFile(index: number, patch: Partial<FileState>) {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function savePhoto(file: File, index: number): Promise<void> {
    setFile(index, { status: "subiendo", progress: 5, message: "Preparando la foto…" });
    const photo = await compressPhoto(file);

    const auth = await requestPhotoUpload({ studentId, bytes: photo.blob.size, contentType: photo.contentType });
    if (!auth.ok) throw new Error(auth.error);

    setFile(index, { progress: 15, message: "Subiendo…" });
    const uploaded = await uploadPhotoToImageKit(photo.blob, auth, (pct) =>
      setFile(index, { progress: 15 + Math.round(pct * 0.75) }),
    );

    setFile(index, { progress: 95, message: "Guardando…" });
    const result = await confirmPhotoUpload({
      intentId: auth.intentId,
      fileId: uploaded.fileId,
      width: photo.width,
      height: photo.height,
      title: title || undefined,
      body: body || undefined,
    });
    if (!result.ok) throw new Error(result.error);
    setFile(index, {
      status: "guardada",
      progress: 100,
      message: result.status === "pending" ? "Guardada. Aparecerá cuando el admin la apruebe." : "¡Guardada!",
    });
  }

  async function saveMedia(file: File, index: number): Promise<void> {
    const type = mediaType(file);
    if (!type) throw new Error("Ese tipo de archivo no está permitido. Usa MP4, MOV, WebM, M4A o MP3.");
    if (file.size > MAX_VIDEO_BYTES) throw new Error("El archivo pesa más de 100 MB. Recórtalo o usa una resolución menor.");

    setFile(index, { status: "subiendo", progress: 3, message: "Revisando la duración…" });
    const seconds = await readDuration(file, type.kind);
    if (!Number.isFinite(seconds) || seconds > MAX_MEDIA_SECONDS) {
      throw new Error(`Dura más de ${MAX_MEDIA_SECONDS} segundos. Recórtalo desde la galería del celular.`);
    }

    const sign = await requestMediaSignature({
      studentId,
      kind: type.kind,
      bytes: file.size,
      contentType: type.contentType,
    });
    if (!sign.ok) throw new Error(sign.error);

    setFile(index, { progress: 8, message: "Subiendo…" });
    await uploadMediaToCloudinary(file, sign, (pct) => setFile(index, { progress: 8 + Math.round(pct * 0.85) }));

    setFile(index, { progress: 95, message: "Guardando…" });
    const result = await confirmMediaUpload({
      intentId: sign.intentId,
      publicId: sign.publicId,
      title: title || undefined,
      body: body || undefined,
    });
    if (!result.ok) throw new Error(result.error);
    setFile(index, {
      status: "guardada",
      progress: 100,
      message: result.status === "pending" ? "Guardado. Aparecerá cuando el admin lo apruebe." : "¡Guardado!",
    });
  }

  async function onPick(list: FileList | null) {
    if (!list || list.length === 0) return;
    if (!studentId) {
      setNotice("Primero elige tu nombre.");
      return;
    }
    const picked = Array.from(list);
    setNotice(null);
    setFiles(picked.map((f) => ({ name: f.name, status: "esperando", progress: 0 })));
    setBusy(true);
    saveStudent(studentId);

    let saved = 0;
    for (let i = 0; i < picked.length; i++) {
      const file = picked[i];
      try {
        if (isPhoto(file)) {
          await savePhoto(file, i);
        } else if (isMedia(file)) {
          await saveMedia(file, i);
        } else {
          throw new Error("Ese tipo de archivo no está permitido.");
        }
        saved++;
      } catch (err) {
        setFile(i, { status: "error", message: err instanceof Error ? err.message : "Algo salió mal." });
      }
    }

    setBusy(false);
    const fallidos = picked.length - saved;
    if (fallidos > 0) avisar(`${fallidos} ${fallidos === 1 ? "archivo no se guardó" : "archivos no se guardaron"}. Revisa el mensaje debajo.`, "error");
    if (saved > 0) {
      avisar(`¡${saved === 1 ? "Recuerdo guardado" : `${saved} recuerdos guardados`}! Gracias 🩺`, "ok");
      await celebrate();
      setTitle("");
      setBody("");
    }
  }

  // Zona de arrastre: al pasar un archivo encima se vuelve dorada y crece un poco.
  const pickerClass = (active: boolean) =>
    `group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-paper px-6 py-8 text-center transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:ring-[3px] focus-within:ring-gold/70 focus-within:ring-offset-2 ${
      active ? "scale-[1.02] border-gold bg-gold/5 shadow-[0_12px_30px_rgba(201,162,39,0.25)]" : "border-primary/40 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    } ${busy ? "pointer-events-none opacity-60" : ""}`;
  const dropProps = (onFiles: (f: FileList | null) => void) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!busy) onFiles(e.dataTransfer.files);
    },
  });

  return (
    <div className="space-y-6">
      <div className="bb-section paper-card p-6 sm:p-8">
        <label className="block">
          <span className="bb-label">¿Quién eres?</span>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="bb-input"
          >
            <option value="">Elige tu nombre</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
                {s.nickname ? ` · ${s.nickname}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="bb-label">Título (opcional)</span>
          <input
            type="text"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            className="bb-input"
            placeholder="Ej. Primer día de anatomía"
          />
          <span className="bb-count">{title.length}/120</span>
        </label>
        <label className="block">
          <span className="bb-label">Una frase (opcional)</span>
          <textarea
            value={body}
            maxLength={500}
            rows={2}
            onChange={(e) => setBody(e.target.value)}
            className="bb-input"
            placeholder="Lo que quieras recordar…"
          />
          <span className="bb-count">{body.length}/500</span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={pickerClass(dragging)} {...dropProps((f) => void onPick(f))}>
          <span className="font-display text-2xl text-secondary">＋ Fotos</span>
          <span className="mt-2 text-sm text-muted">Se comprimen en tu celular.</span>
          <input
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void onPick(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <label className={pickerClass(dragging)} {...dropProps((f) => void onPick(f))}>
          <span className="font-display text-2xl text-secondary">＋ Video o nota de voz</span>
          <span className="mt-2 text-sm text-muted">Máximo 60 segundos y 100 MB.</span>
          <input
            type="file"
            accept="video/*,audio/*,.mp4,.mov,.webm,.m4a,.mp3,.wav,.ogg"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void onPick(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {notice && <p role="alert" className="text-sm text-red-700">{notice}</p>}

      {files.length > 0 && (
        <ul className="space-y-3">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="rounded-xl border border-line p-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate text-text">{f.name}</span>
                <span className="shrink-0 text-muted">{f.status === "guardada" ? "✓" : f.status === "error" ? "✗" : `${f.progress}%`}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${f.progress}%` }} />
              </div>
              {f.message && <p className={`mt-2 text-xs ${f.status === "error" ? "text-red-700" : "text-muted"}`}>{f.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
