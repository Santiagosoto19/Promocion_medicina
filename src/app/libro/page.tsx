import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { memories, students } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { imageUrl } from "@/lib/image-sizes";
import { PrintButton } from "./print-button";

export const revalidate = 10;

const FOTOS_POR_HOJA = 4; // 2 × 2 polaroids en una hoja A4
const CARACTERES_POR_HOJA = 900; // presupuesto de texto para que cada hoja de mensajes no se desborde

// Estilos de la hoja: se ven en pantalla como vista previa y al imprimir (A4, sin márgenes del navegador).
const CSS = `
.libro{counter-reset:pag;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.libro .pagina{position:relative;overflow:hidden;background:#fff;width:min(210mm,100%);aspect-ratio:210/297;margin:0 auto 28px;
  box-shadow:0 10px 30px rgba(15,42,58,.14);counter-increment:pag;padding:17mm 16mm 19mm;box-sizing:border-box}
.libro .pagina::before{content:"";position:absolute;inset:7mm;border:.4mm solid #C9A227;border-radius:3mm;pointer-events:none}
.libro .pagina::after{content:"";position:absolute;inset:9.5mm;border:.15mm solid rgba(201,162,39,.55);border-radius:2mm;pointer-events:none}
.libro .folio{position:absolute;bottom:11mm;left:0;right:0;text-align:center;font-family:var(--font-display),Georgia,serif;font-size:11px;color:#9aa3ad;z-index:1}
.libro .folio::after{content:counter(pag)}
.libro .esquina{position:absolute;width:9mm;height:9mm;color:#C9A227;z-index:1}
.libro .e1,.libro .e2,.libro .e3,.libro .e4{position:absolute;z-index:1;line-height:0}
.libro .e1{top:5mm;left:5mm}.libro .e2{top:5mm;right:5mm;transform:scaleX(-1)}.libro .e3{bottom:5mm;left:5mm;transform:scaleY(-1)}.libro .e4{bottom:5mm;right:5mm;transform:scale(-1)}
.libro .contenido{position:relative;z-index:2;height:100%;display:flex;flex-direction:column}

/* Portada */
.libro .portada{background:radial-gradient(120% 90% at 30% 20%,#17868f 0%,#0E7C86 45%,#0B5F67 100%);color:#F1D77E;text-align:center;justify-content:center;align-items:center}
.libro .portada::before{border-color:#F1D77E}
.libro .portada::after{border-color:rgba(241,215,126,.5)}
.libro .portada .folio{display:none}
.libro .portada .contenido{justify-content:center;align-items:center;text-align:center}
.libro .portada .pequena{font-family:var(--font-hand),cursive;font-size:20px;color:#D8F0F0;margin:0}
.libro .portada .titulo{font-family:var(--font-display),Georgia,serif;font-size:58px;line-height:1.02;margin:6mm 0 4mm;color:#F1D77E;text-shadow:0 1px 0 rgba(0,0,0,.25)}
.libro .portada .subtitulo{font-family:var(--font-hand),cursive;font-size:30px;color:#fff;margin:0}
.libro .portada .sello{margin-top:14mm;width:30mm;height:30mm;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display),Georgia,serif;font-size:40px;color:#5b4608;
  background:radial-gradient(circle at 35% 30%,#F6E3A1 0%,#C9A227 50%,#8A6A12 100%);box-shadow:0 3mm 6mm rgba(0,0,0,.3),inset 0 -1mm 2mm rgba(0,0,0,.25)}

/* Títulos de sección */
.libro .titulo-seccion{font-family:var(--font-display),Georgia,serif;font-size:30px;color:var(--bb-secondary,#1E3A8A);text-align:center;margin:0}
.libro .adorno{display:block;margin:3mm auto 0;color:#C9A227}

/* Dedicatoria */
.libro .dedicatoria{justify-content:center;align-items:center;text-align:center}
.libro .dedicatoria .frase{font-family:var(--font-display),Georgia,serif;font-size:27px;line-height:1.3;color:var(--bb-secondary,#1E3A8A);max-width:130mm;margin:0}
.libro .dedicatoria .firma{font-family:var(--font-hand),cursive;font-size:22px;color:var(--bb-primary,#0E7C86);margin-top:8mm}

/* Fotos: polaroids con cinta y nombre a mano */
.libro .grid-fotos{display:grid;grid-template-columns:1fr 1fr;gap:9mm 8mm;margin-top:9mm;align-content:start;flex:1}
.libro .polaroid-libro{position:relative;background:#fff;padding:4mm 4mm 14mm;box-shadow:0 .8mm 2.5mm rgba(15,42,58,.16),0 2.5mm 6mm rgba(15,42,58,.08);margin:0}
.libro .polaroid-libro img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}
.libro .polaroid-libro figcaption{position:absolute;left:0;right:0;bottom:4mm;text-align:center;font-family:var(--font-hand),cursive;font-size:18px;color:#1F2937}
.libro .r0{transform:rotate(-2deg)}.libro .r1{transform:rotate(1.5deg)}.libro .r2{transform:rotate(-1deg)}.libro .r3{transform:rotate(2deg)}
.libro .washi{position:absolute;top:-3mm;left:50%;width:22mm;height:6mm;transform:translateX(-50%) rotate(-4deg);background:rgba(241,215,126,.65);box-shadow:0 .3mm 1mm rgba(0,0,0,.08)}

/* Mensajes: tarjetas de papel cálido */
.libro .notas{display:flex;flex-direction:column;gap:6mm;margin-top:8mm}
.libro .nota{background:#fdfbf6;border:.25mm solid #eadfbf;border-left:1.2mm solid var(--bb-primary,#0E7C86);border-radius:2.5mm;padding:5mm 6mm;break-inside:avoid;position:relative}
.libro .nota .comilla{position:absolute;top:1mm;right:4mm;font-family:var(--font-display),Georgia,serif;font-size:46px;line-height:1;color:rgba(201,162,39,.45)}
.libro .nota .para{font-family:var(--font-hand),cursive;font-size:19px;color:var(--bb-primary,#0E7C86);margin:0 0 1mm}
.libro .nota .cuerpo{font-family:var(--font-hand),cursive;font-size:20px;line-height:1.35;color:#1F2937;white-space:pre-line;margin:0}
.libro .nota .autor{font-family:var(--font-display),Georgia,serif;font-size:13px;color:#6B7280;text-align:right;margin:3mm 0 0}

/* Cierre */
.libro .cierre{justify-content:center;align-items:center;text-align:center;background:linear-gradient(180deg,#fff 0%,#f3f8f8 100%)}
.libro .cierre .grande{font-family:var(--font-display),Georgia,serif;font-size:40px;color:var(--bb-secondary,#1E3A8A);margin:0;line-height:1.15}
.libro .cierre .fecha{font-family:var(--font-hand),cursive;font-size:24px;color:var(--bb-primary,#0E7C86);margin:5mm 0 0}
.libro .cierre .sello{margin-top:12mm;width:26mm;height:26mm;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:34px;color:#5b4608;
  background:radial-gradient(circle at 35% 30%,#F6E3A1 0%,#C9A227 50%,#8A6A12 100%);box-shadow:0 3mm 6mm rgba(0,0,0,.2)}

/* Impresión: solo se imprime el libro, en hojas A4 sin márgenes extra */
@page{size:A4;margin:0}
@media print{
  body *{visibility:hidden}
  .libro,.libro *{visibility:visible}
  .libro ~ *{display:none!important}
  .libro{position:absolute;left:0;top:0;width:100%;padding:0!important;margin:0!important}
  .libro .pagina{width:210mm;height:297mm;aspect-ratio:auto;margin:0;box-shadow:none;break-after:page;page-break-after:always}
  .libro .pagina:last-child{break-after:auto;page-break-after:auto}
}
`;

// Adornos decorativos (SVG simples, sin imágenes externas).
function Adorno({ ancho = 120 }: { ancho?: number }) {
  return (
    <svg width={ancho} height="12" viewBox="0 0 120 12" className="adorno" aria-hidden="true">
      <path d="M0 6 H46" stroke="currentColor" strokeWidth="0.8" />
      <path d="M74 6 H120" stroke="currentColor" strokeWidth="0.8" />
      <path d="M60 1 L65 6 L60 11 L55 6 Z" fill="currentColor" />
      <circle cx="48" cy="6" r="1.2" fill="currentColor" />
      <circle cx="72" cy="6" r="1.2" fill="currentColor" />
    </svg>
  );
}

function Esquinas() {
  const trazo = (
    <svg viewBox="0 0 26 26" className="esquina" aria-hidden="true">
      <path d="M1 13 Q1 1 13 1" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="13" cy="13" r="2" fill="currentColor" />
    </svg>
  );
  return (
    <>
      <span className="e1">{trazo}</span>
      <span className="e2">{trazo}</span>
      <span className="e3">{trazo}</span>
      <span className="e4">{trazo}</span>
    </>
  );
}

// Parte una lista en grupos de tamaño fijo.
function partirPorCantidad<T>(lista: T[], n: number): T[][] {
  const grupos: T[][] = [];
  for (let i = 0; i < lista.length; i += n) grupos.push(lista.slice(i, i + n));
  return grupos;
}

// Reparte los mensajes en hojas según su largo, sin pasar el presupuesto de caracteres.
function partirMensajes<T extends { body: string | null }>(lista: T[]): T[][] {
  const hojas: T[][] = [];
  let actual: T[] = [];
  let largo = 0;
  for (const m of lista) {
    const l = (m.body ?? "").length;
    if (actual.length > 0 && largo + l > CARACTERES_POR_HOJA) {
      hojas.push(actual);
      actual = [];
      largo = 0;
    }
    actual.push(m);
    largo += l;
  }
  if (actual.length) hojas.push(actual);
  return hojas;
}

// Libro para imprimir o guardar como PDF desde el navegador (Ctrl+P → Guardar como PDF).
export default async function LibroPage() {
  const settings = await getSettings();
  const [photos, messages] = await Promise.all([
    db
      .select({ path: memories.imagekitFilePath, studentName: students.fullName })
      .from(memories)
      .innerJoin(students, eq(students.id, memories.studentId))
      .where(and(eq(memories.status, "approved"), eq(memories.type, "photo")))
      .orderBy(asc(students.fullName))
      .limit(300),
    db
      .select({ body: memories.body, title: memories.title, studentName: students.fullName })
      .from(memories)
      .innerJoin(students, eq(students.id, memories.studentId))
      .where(and(eq(memories.status, "approved"), eq(memories.type, "message"), ne(memories.body, "")))
      .orderBy(desc(memories.createdAt))
      .limit(300),
  ]);

  const fotosConRuta = photos.filter((p): p is { path: string; studentName: string } => !!p.path);
  const hojasFotos = partirPorCantidad(fotosConRuta, FOTOS_POR_HOJA);
  const hojasMensajes = partirMensajes(messages);
  const nombre = settings.siteName || "Bata Blanca";

  return (
    <main className="libro mx-auto px-2 py-8 sm:px-0">
      <style>{CSS}</style>
      <div className="mb-6 flex justify-center print:hidden">
        <PrintButton />
      </div>

      {/* Portada */}
      <section className="pagina portada">
        <Esquinas />
        <div className="contenido">
          <p className="pequena">Promoción de Medicina · Universidad de Sucre</p>
          <h1 className="titulo">{nombre}</h1>
          <Adorno ancho={150} />
          <p className="subtitulo">Libro de recuerdos</p>
          <div className="sello" aria-hidden="true">✚</div>
        </div>
      </section>

      {/* Dedicatoria */}
      <section className="pagina dedicatoria">
        <Esquinas />
        <div className="contenido dedicatoria">
          <p className="frase">Cinco años de madrugadas, cafés y parciales… y hoy nos ponemos la bata.</p>
          <Adorno ancho={90} />
          <p className="firma">Con cariño, la promoción</p>
        </div>
        <span className="folio" />
      </section>

      {/* Fotos */}
      {hojasFotos.length === 0 ? (
        <section className="pagina">
          <Esquinas />
          <div className="contenido">
            <h2 className="titulo-seccion">Fotos</h2>
            <Adorno />
            <p className="mt-16 text-center font-hand text-2xl text-muted">Aún no hay fotos aprobadas.</p>
          </div>
          <span className="folio" />
        </section>
      ) : (
        hojasFotos.map((hoja, k) => (
          <section key={`f-${k}`} className="pagina">
            <Esquinas />
            <div className="contenido">
              <h2 className="titulo-seccion">Fotos</h2>
              <Adorno />
              <div className="grid-fotos">
                {hoja.map((p, i) => (
                  <figure key={i} className={`polaroid-libro r${i % 4}`}>
                    <span className="washi" aria-hidden="true" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl(p.path, "gallery")} alt={p.studentName} loading="lazy" decoding="async" />
                    <figcaption>{p.studentName}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <span className="folio" />
          </section>
        ))
      )}

      {/* Mensajes */}
      {hojasMensajes.map((hoja, k) => (
        <section key={`m-${k}`} className="pagina">
          <Esquinas />
          <div className="contenido">
            <h2 className="titulo-seccion">Mensajes</h2>
            <Adorno />
            <div className="notas">
              {hoja.map((m, i) => (
                <article key={i} className="nota">
                  <span className="comilla" aria-hidden="true">“</span>
                  {m.title && <p className="para">Para {m.title}</p>}
                  <p className="cuerpo">{m.body}</p>
                  <p className="autor">— {m.studentName}</p>
                </article>
              ))}
            </div>
          </div>
          <span className="folio" />
        </section>
      ))}

      {/* Cierre */}
      <section className="pagina cierre">
        <Esquinas />
        <div className="contenido cierre">
          <p className="grande">Hoy nos ponemos la bata.</p>
          <p className="fecha">5 de diciembre de 2026</p>
          <div className="sello" aria-hidden="true">✚</div>
        </div>
        <span className="folio" />
      </section>
    </main>
  );
}
