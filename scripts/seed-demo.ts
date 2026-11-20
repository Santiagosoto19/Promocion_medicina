// Datos de ejemplo para ver el diseño con contenido. Todo queda marcado con "[Demo]" y se borra con: npm run demo:remove
import "./load-env";
import { readFileSync } from "node:fs";
import { createHmac, randomUUID } from "node:crypto";
import { db } from "../src/db";
import { eq } from "drizzle-orm";
import { guestbook, memories, students, teachers, timelineEvents } from "../src/db/schema";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY!;
const FOLDER = "/bata-blanca/demo";

// Sube una imagen a ImageKit con la misma firma que usa la app.
async function upload(file: string, name: string): Promise<{ fileId: string; filePath: string }> {
  const token = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 600;
  const signature = createHmac("sha1", PRIVATE_KEY).update(token + expire).digest("hex");
  const form = new FormData();
  form.append("file", new Blob([readFileSync(file)], { type: "image/jpeg" }), name);
  form.append("fileName", name);
  form.append("folder", FOLDER);
  form.append("publicKey", PUBLIC_KEY);
  form.append("signature", signature);
  form.append("expire", String(expire));
  form.append("token", token);
  form.append("useUniqueFileName", "false");
  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", body: form });
  const json = (await res.json()) as { fileId?: string; filePath?: string; message?: string };
  if (!res.ok || !json.fileId || !json.filePath) throw new Error(`ImageKit ${res.status}: ${json.message ?? "sin detalle"}`);
  return { fileId: json.fileId, filePath: json.filePath };
}

const people = [
  { name: "[Demo] Laura Martínez", nick: "La Doctora Café", quote: "Primero el café, luego la anatomía.", asset: "m1.jpg", title: "Primer día de anatomía" },
  { name: "[Demo] Andrés Paternina", nick: "El Cirujano", quote: "Nadie nace sabiendo suturar.", asset: "m2.jpg", title: "Práctica en el laboratorio" },
  { name: "[Demo] Valentina Ruiz", nick: "Vale Pulso", quote: "Cada latido cuenta.", asset: "m3.jpg", title: "Noche de estudio en grupo" },
  { name: "[Demo] Camilo Hernández", nick: "Cami Rumba", quote: "Estudiar también es vivir.", asset: "m4.jpg", title: "Salida de integración" },
  { name: "[Demo] Sofía Gómez", nick: "Sofi Estetoscopio", quote: "Escuchar antes de hablar.", asset: "m5.jpg", title: "Ceremonia de inicio" },
  { name: "[Demo] Julián Pérez", nick: "Julo Apuntes", quote: "Mis apuntes salvan vidas.", asset: "m6.jpg", title: "Parcial de fisiología" },
];

async function main() {
  console.log("Creando estudiantes de ejemplo…");
  for (const [i, p] of people.entries()) {
    const [s] = await db
      .insert(students)
      .values({ fullName: p.name, nickname: p.nick, quote: p.quote, slug: `demo-${i + 1}`, orderIndex: 900 + i })
      .onConflictDoNothing()
      .returning({ id: students.id });
    if (!s) continue;

    const file = await upload(`scripts/demo-assets/${p.asset}`, `demo-${i + 1}.jpg`);
    await db.insert(memories).values({
      studentId: s.id,
      type: "photo",
      storage: "imagekit",
      imagekitFileId: file.fileId,
      imagekitFilePath: file.filePath,
      bytes: 100000,
      width: 800,
      height: 800,
      title: `[Demo] ${p.title}`,
      status: "approved",
      moderatedAt: new Date(),
    });
  }

  const [anyStudent] = await db.select({ id: students.id }).from(students).where(eq(students.slug, "demo-1")).limit(1);
  if (anyStudent) {
    const messages = [
      { from: "demo-1", to: "[Demo] La promoción", text: "Gracias por estos cinco años. Nunca olvidaré las noches de estudio." },
      { from: "demo-2", to: "[Demo] Mi compañera Vale", text: "Siempre tuviste la mano firme y la sonrisa lista. ¡Sigue así!" },
      { from: "demo-4", to: "[Demo] Yo del futuro", text: "Recuerda por qué empezaste. Cuando estés cansado, vuelve a leer esto." },
    ];
    for (const m of messages) {
      const [s] = await db.select({ id: students.id }).from(students).where(eq(students.slug, m.from)).limit(1);
      if (s) await db.insert(memories).values({ studentId: s.id, type: "message", title: m.to, body: m.text, status: "approved", moderatedAt: new Date() });
    }
  }

  // Firmas de ejemplo: trazos suaves (normalizados 0–1000) para que la bata se vea llena.
  const firmantes = ["demo-1", "demo-2", "demo-3", "demo-4", "demo-5", "demo-6"];
  for (const [i, slug] of firmantes.entries()) {
    const [s] = await db.select({ id: students.id }).from(students).where(eq(students.slug, slug)).limit(1);
    if (!s) continue;
    const trazos: [number, number][][] = [0, 1].map((k) =>
      Array.from({ length: 40 }, (_, j) => {
        const x = 150 + j * 18 + i * 3;
        const y = 500 + 140 * Math.sin(j / 4 + k + i) * (k ? -1 : 1);
        return [Math.round(x), Math.round(y)] as [number, number];
      }),
    );
    await db.insert(memories).values({
      studentId: s.id,
      type: "signature",
      title: "[Demo] Firma de ejemplo",
      body: JSON.stringify({ v: 1, strokes: trazos }),
      status: "approved",
      moderatedAt: new Date(),
    });
  }

  await db.insert(teachers).values([
    { name: "[Demo] Dra. Patricia Vélez", subject: "Anatomía humana", orderIndex: 900 },
    { name: "[Demo] Dr. Carlos Mendoza", subject: "Fisiología", orderIndex: 901 },
  ]);
  await db.insert(timelineEvents).values([
    { title: "[Demo] Primer día de clases", eventDate: "Semestre 1 · Agosto", description: "Llegamos con batas nuevas y muchas preguntas.", orderIndex: 1 },
    { title: "[Demo] Primera práctica de anatomía", eventDate: "Semestre 2", description: "El primer contacto con el laboratorio.", orderIndex: 2 },
    { title: "[Demo] Ceremonia de entrega de batas", eventDate: "5 de diciembre de 2026", description: "El día que todo esto se vuelve real.", orderIndex: 3 },
  ]);
  await db.insert(guestbook).values({ authorName: "[Demo] Mamá de Laura", relationship: "Familia", body: "Orgullosa de ti, hija. Sigue soñando en grande.", status: "approved" });

  console.log("Listo. Los datos de ejemplo llevan [Demo]. Para borrarlos: npm run demo:remove");
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
