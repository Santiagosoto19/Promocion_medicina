import { desc, eq, ne, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { auditLog, memories, students } from "@/db/schema";
import { MemoryMedia } from "@/components/memory-media";
import { getSettings } from "@/lib/access";
import { requireAdmin } from "@/lib/admin-session";
import { setMemoryStatus } from "./moderacion/actions";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

const ACCIONES: Record<string, string> = {
  "recuerdo.subido": "subió un recuerdo",
  "firma.guardada": "firmó la bata",
  "mensaje.guardado": "dejó un mensaje",
  "capsula.guardada": "escribió una carta a su yo del futuro",
  "visita.guardada": "dejó un mensaje en el libro de visitas",
  "premio.voto": "votó en los premios",
  "recuerdo.estado": "cambió el estado de un recuerdo",
  "estudiante.creado": "agregó un estudiante",
  "login.ok": "inició sesión",
  logout: "cerró sesión",
};

// Un id de sesión no se muestra: en su lugar, "El administrador".
function quien(actor: string) {
  return /^[0-9a-f-]{36}$/i.test(actor) ? "El administrador" : actor;
}

function hace(d: Date) {
  const min = Math.round((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export default async function AdminInicio() {
  await requireAdmin();
  const settings = await getSettings();

  const [aprobados, pendientes, totalEstudiantes, conAporte, firmas, recientesPendientes, actividad] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(memories).where(eq(memories.status, "approved")),
    db.select({ n: sql<number>`count(*)::int` }).from(memories).where(eq(memories.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(students),
    db.select({ n: sql<number>`count(distinct ${memories.studentId})::int` }).from(memories).where(ne(memories.status, "hidden")),
    db.select({ n: sql<number>`count(*)::int` }).from(memories).where(eq(memories.type, "signature")),
    db
      .select({
        id: memories.id,
        type: memories.type,
        title: memories.title,
        path: memories.imagekitFilePath,
        publicId: memories.cloudinaryPublicId,
        width: memories.width,
        height: memories.height,
        studentName: students.fullName,
      })
      .from(memories)
      .innerJoin(students, eq(students.id, memories.studentId))
      .where(eq(memories.status, "pending"))
      .orderBy(desc(memories.createdAt))
      .limit(6),
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(10),
  ]);

  const nAprobados = aprobados[0].n;
  const nPendientes = pendientes[0].n;
  const nEst = totalEstudiantes[0].n;
  const nConAporte = conAporte[0].n;
  const nFirmas = firmas[0].n;
  const sinAportes = Math.max(0, nEst - nConAporte);
  const ceremonia = settings.ceremonyAt ?? new Date("2026-12-05T08:00:00-05:00");
  const dias = Math.ceil((ceremonia.getTime() - Date.now()) / 86_400_000);

  const alertas: { nivel: "rojo" | "dorado" | "verde"; texto: string; href?: string; accion?: string }[] = [];
  if (nPendientes > 0) alertas.push({ nivel: "rojo", texto: `${nPendientes} ${nPendientes === 1 ? "recuerdo espera" : "recuerdos esperan"} aprobación`, href: "/admin/moderacion", accion: "Moderar ahora" });
  if (sinAportes > 0) alertas.push({ nivel: "dorado", texto: `${sinAportes} ${sinAportes === 1 ? "estudiante aún no ha participado" : "estudiantes aún no han participado"}`, href: "/admin/promocion", accion: "Ver lista" });
  if (!settings.ceremonyAt) alertas.push({ nivel: "dorado", texto: "La fecha de la ceremonia aún no está fijada", href: "/admin/ajustes", accion: "Fijar fecha" });
  if (alertas.length === 0) alertas.push({ nivel: "verde", texto: "Todo al día ✨" });

  const colores = { rojo: "border-[#B4235A] bg-[#B4235A]/[0.04]", dorado: "border-gold bg-gold/[0.06]", verde: "border-primary bg-primary/[0.04]" };

  const kpis = [
    { label: "Recuerdos publicados", valor: nAprobados, nota: "aprobados y visibles" },
    { label: "Estudiantes", valor: `${nConAporte}/${nEst}`, nota: `${nEst ? Math.round((nConAporte / nEst) * 100) : 0}% han participado` },
    { label: "Firmas en la bata", valor: nFirmas, nota: "trazos sobre la bata" },
    { label: "Por revisar", valor: nPendientes, nota: nPendientes ? "necesitan tu decisión" : "nada pendiente", rosa: nPendientes > 0 },
  ];

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold tracking-wider text-muted uppercase">Panel / Inicio</p>
          <h1 className="mt-1 font-display text-3xl text-secondary sm:text-4xl">Hola, admin 👋</h1>
          <p className="mt-1 font-hand text-2xl text-primary">
            {dias > 0 ? `Faltan ${dias} días para la entrega de batas` : dias === 0 ? "¡Hoy es el día! 🩺" : "La ceremonia ya pasó"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" className="inline-flex min-h-11 items-center rounded-full border border-primary/40 bg-white px-4 text-sm font-medium text-primary hover:bg-primary/5">Ver sitio como estudiante ↗</Link>
          <form action={logoutAction} className="sm:hidden">
            <button className="min-h-11 rounded-full border border-line bg-white px-4 text-sm">Salir</button>
          </form>
        </div>
      </header>

      <section aria-label="Alertas" className="mt-6 grid gap-3">
        {alertas.map((a, i) => (
          <div key={i} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border-l-4 px-5 py-4 ${colores[a.nivel]}`}>
            <p className="text-[15px] text-text">{a.texto}</p>
            {a.href && (
              <Link href={a.href} className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-white hover:brightness-110">
                {a.accion}
              </Link>
            )}
          </div>
        ))}
      </section>

      <section aria-label="Cifras" className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="paper-card p-5">
            <p className="text-[13px] font-semibold tracking-wider text-muted uppercase">{k.label}</p>
            <p className={`mt-2 font-display text-4xl tabular-nums ${k.rosa ? "text-[#B4235A]" : "text-secondary"}`}>{k.valor}</p>
            <p className="mt-1 text-sm text-muted">{k.nota}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="por-moderar">
          <div className="flex items-center justify-between">
            <h2 id="por-moderar" className="font-display text-xl text-secondary">Por moderar</h2>
            <Link href="/admin/moderacion" className="text-sm font-medium text-primary hover:underline">Ver todos ({nPendientes}) →</Link>
          </div>
          {recientesPendientes.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center font-hand text-xl text-primary">Nada por revisar. ¡Buen trabajo! ✨</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {recientesPendientes.map((m) => (
                <li key={m.id} className="paper-card overflow-hidden">
                  <div className="aspect-square overflow-hidden bg-surface">
                    <MemoryMedia type={m.type} path={m.path} publicId={m.publicId} width={m.width} height={m.height} alt={m.title ?? `Recuerdo de ${m.studentName}`} />
                  </div>
                  <p className="truncate px-3 pt-2 text-sm text-text">{m.studentName}</p>
                  <div className="flex gap-2 p-3">
                    <form action={setMemoryStatus.bind(null, m.id, "approved")} className="flex-1">
                      <button aria-label={`Aprobar recuerdo de ${m.studentName}`} className="min-h-10 w-full rounded-xl bg-primary text-sm font-medium text-white hover:brightness-110">✓ Aprobar</button>
                    </form>
                    <form action={setMemoryStatus.bind(null, m.id, "hidden")}>
                      <button aria-label={`Ocultar recuerdo de ${m.studentName}`} className="min-h-10 rounded-xl border border-line px-3 text-sm text-secondary hover:bg-surface">✕</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="actividad">
          <h2 id="actividad" className="font-display text-xl text-secondary">Actividad reciente</h2>
          {actividad.length === 0 ? (
            <p className="mt-4 text-muted">Todavía no hay actividad.</p>
          ) : (
            <ol className="paper-card mt-4 divide-y divide-line">
              {actividad.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm text-text">
                      <span className="font-medium">{quien(a.actor)}</span> {ACCIONES[a.action] ?? a.action}
                    </p>
                    <p className="text-[13px] text-muted">{hace(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section aria-labelledby="accesos" className="mt-10">
        <h2 id="accesos" className="font-display text-xl text-secondary">Accesos rápidos</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/en-vivo", label: "Pantalla en vivo", target: true },
            { href: "/admin/ceremonia", label: "Llamado a lista" },
            { href: "/admin/moderacion", label: "Moderar recuerdos" },
            { href: "/admin/promocion", label: "Estudiantes" },
          ].map((q) => (
            <Link key={q.href} href={q.href} target={q.target ? "_blank" : undefined} className="paper-card flex min-h-14 items-center justify-center p-4 text-center text-[15px] font-medium text-secondary hover:text-primary">
              {q.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
