'use client';

/**
 * BataFirmas — "La bata de la promoción"
 * Bata blanca ilustrada en SVG donde cada estudiante deja su firma.
 *
 * - Sin dependencias externas (solo React). Animaciones en CSS.
 * - Las firmas se acomodan solas sobre la tela (evitan solapas, bolsillos,
 *   botones y estetoscopio) y se reparten de forma pareja aunque sean 5 o 100.
 * - Una firma puede ser un trazo dibujado (path SVG del canvas) o solo el nombre,
 *   que se "escribe" en letra manuscrita.
 *
 * Fuentes: usa --font-fraunces, --font-caveat y --font-manrope si existen
 * (next/font), y si no, las familias 'Fraunces', 'Caveat' y 'Manrope'.
 */

import { useMemo, useState } from 'react';

export type Firma = {
  id: string;
  nombre: string;
  /** Frase corta que deja el estudiante (se ve al pasar el cursor / tocar). */
  mensaje?: string;
  /** Atributo `d` de un path SVG dibujado en un canvas de 300×120. Opcional. */
  trazo?: string;
  /** Color de tinta. Si no se da, se elige uno de la paleta según el id. */
  color?: string;
  /** Texto de fecha ya formateado, ej. "28 nov 2026". */
  fecha?: string;
};

type Props = {
  firmas: Firma[];
  onFirmar?: () => void;
  onDescargar?: () => void;
  /** id de la firma recién creada: se resalta con un brillo dorado. */
  resaltarId?: string;
  titulo?: string;
};

/* ────────────────────────── utilidades ────────────────────────── */

const W = 600;
const H = 800;
const TINTAS = ['#1E3A8A', '#0E7C86', '#7A2E4D', '#8A6A12', '#334155', '#9D174D'];

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const rnd = (seed: number, min: number, max: number) =>
  min + ((seed % 10000) / 10000) * (max - min);

type Pt = [number, number];
function dentro(p: Pt, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
const espejo = (poly: Pt[]): Pt[] => poly.map(([x, y]) => [W - x, y]);

/* Zonas de la tela donde se puede firmar (fuera de las solapas). */
const PANEL_IZQ: Pt[] = [
  [160, 132], [222, 108], [233, 176], [212, 200], [298, 332], [298, 712], [154, 712],
];
const PANEL_DER: Pt[] = espejo(PANEL_IZQ);

/* Zonas prohibidas: bordado, bolsillo del pecho, botones, estetoscopio, bordes de bolsillos. */
const PROHIBIDAS: [number, number, number, number][] = [
  [150, 236, 100, 46], // bordado
  [342, 218, 82, 96], // bolsillo del pecho + bolígrafos
  [296, 330, 36, 390], // tira de botones
  [258, 318, 96, 86], // campana y olivas del estetoscopio
  [232, 236, 40, 110], // tubo izquierdo del estetoscopio
  [166, 474, 110, 22], // borde del bolsillo izquierdo
  [326, 474, 110, 22], // borde del bolsillo derecho
];
const enProhibida = ([x, y]: Pt) =>
  PROHIBIDAS.some(([rx, ry, rw, rh]) => x > rx && x < rx + rw && y > ry && y < ry + rh);

const permitido = (p: Pt) => (dentro(p, PANEL_IZQ) || dentro(p, PANEL_DER)) && !enProhibida(p);

type Slot = { x: number; y: number; w: number; h: number; rot: number };

/** Genera posiciones repartidas de forma pareja para N firmas, sin que se encimen. */
function calcularSlots(n: number): Slot[] {
  if (n <= 0) return [];
  let escala = Math.max(0.36, Math.min(1, Math.sqrt(12 / n)));

  for (let intento = 0; intento < 12; intento++) {
    const w = 94 * escala;
    const h = 30 * escala;

    // Malla fina de candidatos dentro de la tela
    const candidatos: (Slot & { manga?: boolean })[] = [];
    for (let y = 120; y < 712; y += 8) {
      for (let x = 150; x < 452; x += 8) {
        const caja: Pt[] = [];
        for (let dx = -w / 2; dx <= w / 2 + 0.1; dx += Math.max(6, w / 12)) {
          caja.push([x + dx, y - h / 2], [x + dx, y], [x + dx, y + h / 2]);
        }
        if (caja.every(permitido)) {
          candidatos.push({ x, y, w, h, rot: rnd(hash(`${x}-${y}`), -6, 6) });
        }
      }
    }
    // Mangas (firmas verticales): solo cuando ya hay bastantes firmas
    if (n >= 10) {
      const largo = Math.min(130, 100 * escala + 24);
      candidatos.push(
        { x: 132, y: 300, w: largo, h: 24, rot: -85, manga: true },
        { x: 123, y: 450, w: largo, h: 26, rot: -86, manga: true },
        { x: W - 132, y: 300, w: largo, h: 24, rot: 85, manga: true },
        { x: W - 123, y: 450, w: largo, h: 26, rot: 86, manga: true },
      );
    }

    // Selección por punto más lejano, empezando en el pecho izquierdo
    const elegidos: Slot[] = [];
    const libres = [...candidatos];
    const choca = (a: Slot & { manga?: boolean }, b: Slot) => {
      const aw = Math.abs(a.rot) > 45 ? a.h : a.w;
      const ah = Math.abs(a.rot) > 45 ? a.w : a.h;
      const bw = Math.abs(b.rot) > 45 ? b.h : b.w;
      const bh = Math.abs(b.rot) > 45 ? b.w : b.h;
      return Math.abs(a.x - b.x) < (aw + bw) / 2 + 4 && Math.abs(a.y - b.y) < (ah + bh) / 2 + 4;
    };
    while (elegidos.length < n && libres.length) {
      let mejor = -1;
      let mejorDist = -1;
      for (let i = 0; i < libres.length; i++) {
        const c = libres[i];
        if (elegidos.some((e) => choca(c, e))) continue;
        const d = elegidos.length
          ? Math.min(...elegidos.map((e) => Math.hypot(e.x - c.x, (e.y - c.y) * 1.5)))
          : -Math.hypot(c.x - 210, c.y - 360);
        if (d > mejorDist || mejor === -1) {
          mejorDist = d;
          mejor = i;
        }
      }
      if (mejor === -1) break;
      elegidos.push(libres.splice(mejor, 1)[0]);
    }
    if (elegidos.length >= n || escala <= 0.36) {
      // Si aún faltan espacios (muchísimas firmas), se reutilizan con desplazamiento
      let k = 0;
      while (elegidos.length < n && elegidos.length > 0) {
        const base = elegidos[k];
        elegidos.push({ ...base, x: base.x + 5, y: base.y + base.h * 0.55, rot: base.rot + 5 });
        k++;
      }
      return elegidos;
    }
    escala = Math.max(0.36, escala * 0.92);
  }
  return [];
}

/* ────────────────────────── componente ────────────────────────── */

export default function BataFirmas({
  firmas,
  onFirmar,
  onDescargar,
  resaltarId,
  titulo = 'La bata de la promoción',
}: Props) {
  const [activa, setActiva] = useState<string | null>(null);
  const slots = useMemo(() => calcularSlots(firmas.length), [firmas.length]);
  const activaIdx = firmas.findIndex((f) => f.id === activa);
  const firmaActiva = activaIdx >= 0 ? firmas[activaIdx] : null;
  const slotActivo = activaIdx >= 0 ? slots[activaIdx] : null;

  return (
    <section className="bf-root">
      <style>{CSS}</style>

      <div className="bf-glow bf-glow-a" aria-hidden />
      <div className="bf-glow bf-glow-b" aria-hidden />

      <header className="bf-head">
        <p className="bf-eyebrow">Una tradición de la promoción</p>
        <h2 className="bf-title">
          {titulo.split('bata').map((parte, i, arr) => (
            <span key={i}>
              {parte}
              {i < arr.length - 1 && <em className="bf-shine">bata</em>}
            </span>
          ))}
        </h2>
        <svg className="bf-ecg" viewBox="0 0 320 40" aria-hidden>
          <path
            pathLength={1}
            d="M0 22 H110 l10 0 l6 -14 l8 28 l7 -24 l5 10 H200 l6 -6 l6 6 H320"
          />
        </svg>
        <p className="bf-count">
          <strong>{firmas.length}</strong>{' '}
          {firmas.length === 1 ? 'compañero ya la firmó' : 'compañeros ya la firmaron'}
          <span className="bf-count-extra">
            <span className="bf-dot" /> cada trazo es un “aquí estuve”
          </span>
        </p>
      </header>

      <div className="bf-stage">
        <svg
          className="bf-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="group"
          aria-label={`Bata blanca con ${firmas.length} firmas de la promoción`}
        >
          <defs>
            <linearGradient id="bf-telaL" x1="0" x2="1">
              <stop offset="0" stopColor="#EEF2F5" />
              <stop offset="0.35" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#F7F9FB" />
            </linearGradient>
            <linearGradient id="bf-telaR" x1="0" x2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.7" stopColor="#FBFCFD" />
              <stop offset="1" stopColor="#E9EEF2" />
            </linearGradient>
            <linearGradient id="bf-manga" x1="0" x2="1">
              <stop offset="0" stopColor="#E6ECF0" />
              <stop offset="1" stopColor="#FAFBFC" />
            </linearGradient>
            <linearGradient id="bf-solapa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#F2F5F8" />
            </linearGradient>
            <linearGradient id="bf-scrub" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0B6E77" />
              <stop offset="1" stopColor="#13939E" />
            </linearGradient>
            <linearGradient id="bf-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FAFBFC" />
              <stop offset="0.5" stopColor="#A9B4BF" />
              <stop offset="1" stopColor="#E8ECF0" />
            </linearGradient>
            <linearGradient id="bf-oro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F1D77E" />
              <stop offset="0.5" stopColor="#C9A227" />
              <stop offset="1" stopColor="#9C7A16" />
            </linearGradient>
            <filter id="bf-sombra" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F2A3A" floodOpacity="0.08" />
              <feDropShadow dx="0" dy="22" stdDeviation="22" floodColor="#0F2A3A" floodOpacity="0.13" />
            </filter>
            <filter id="bf-sombraSuave" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#0F2A3A" floodOpacity="0.14" />
            </filter>
            <filter id="bf-brillo" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* sombra en el piso */}
          <ellipse cx="300" cy="752" rx="190" ry="14" fill="#0F2A3A" opacity="0.09" filter="url(#bf-brillo)" />

          {/* gancho dorado */}
          <path
            d="M300 86 V58 C300 43 313 35 324 39 C336 43 336 60 324 64"
            fill="none"
            stroke="url(#bf-oro)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          <g className="bf-coat" filter="url(#bf-sombra)">
            {/* mangas */}
            <path
              d="M182 118 C156 124 134 142 126 176 L94 548 C93 560 100 568 112 570 L150 574 C160 575 166 568 166 558 L176 260 Z"
              fill="url(#bf-manga)"
              stroke="#CBD5DD"
              strokeWidth="1.6"
            />
            <path
              d="M418 118 C444 124 466 142 474 176 L506 548 C507 560 500 568 488 570 L450 574 C440 575 434 568 434 558 L424 260 Z"
              fill="url(#bf-manga)"
              stroke="#CBD5DD"
              strokeWidth="1.6"
            />
            {/* puños y pliegues de manga */}
            <path d="M97 522 Q130 530 163 532" fill="none" stroke="#CBD5DD" strokeWidth="1.4" />
            <path d="M503 522 Q470 530 437 532" fill="none" stroke="#CBD5DD" strokeWidth="1.4" />
            <path d="M112 372 Q126 364 142 371" fill="none" stroke="#DCE3E8" strokeWidth="1.3" />
            <path d="M488 372 Q474 364 458 371" fill="none" stroke="#DCE3E8" strokeWidth="1.3" />

            {/* uniforme (scrub) visible en el escote */}
            <path d="M254 92 Q300 114 346 92 L300 312 Z" fill="url(#bf-scrub)" />
            <path d="M274 104 L300 196 L326 104" fill="none" stroke="#5FC1C8" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />

            {/* cuello trasero + etiqueta */}
            <path
              d="M250 92 C268 78 332 78 350 92 L345 100 C328 90 272 90 255 100 Z"
              fill="#FFFFFF"
              stroke="#CBD5DD"
              strokeWidth="1.4"
            />
            <rect x="291" y="88" width="18" height="9" rx="1.5" fill="#FFFFFF" stroke="url(#bf-oro)" strokeWidth="1.2" />

            {/* panel izquierdo */}
            <path
              d="M256 94 L178 118 C162 124 154 138 153 158 L147 712 C147 722 154 728 164 728 L304 730 L304 334 L300 326 Z"
              fill="url(#bf-telaL)"
              stroke="#CBD5DD"
              strokeWidth="1.6"
            />
            {/* panel derecho (cruza sobre el izquierdo) */}
            <path
              d="M344 94 L422 118 C438 124 446 138 447 158 L453 712 C453 722 446 728 436 728 L296 730 L296 334 L300 326 Z"
              fill="url(#bf-telaR)"
              stroke="#CBD5DD"
              strokeWidth="1.6"
            />

            {/* pliegues de la tela */}
            <g fill="none" stroke="#E3E9EE" strokeWidth="1.6" strokeLinecap="round">
              <path d="M198 300 C194 420 190 560 184 700" />
              <path d="M268 380 C266 500 270 610 274 704" />
              <path d="M402 300 C406 420 410 560 416 700" />
              <path d="M346 600 C348 640 350 680 352 706" />
            </g>
            {/* costura del ruedo */}
            <path d="M152 712 L298 714" stroke="#D5DDE3" strokeWidth="1.2" strokeDasharray="4 4" />
            <path d="M302 714 L448 712" stroke="#D5DDE3" strokeWidth="1.2" strokeDasharray="4 4" />

            {/* solapas */}
            <g filter="url(#bf-sombraSuave)">
              <path
                d="M258 90 L222 104 C226 130 230 154 236 176 L250 182 L214 198 C236 248 268 296 300 328 C288 250 272 170 258 90 Z"
                fill="url(#bf-solapa)"
                stroke="#C3CED7"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M342 90 L378 104 C374 130 370 154 364 176 L350 182 L386 198 C364 248 332 296 300 328 C312 250 328 170 342 90 Z"
                fill="url(#bf-solapa)"
                stroke="#C3CED7"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </g>

            {/* bordado */}
            <text x="196" y="262" textAnchor="middle" className="bf-bordado">
              Medicina
            </text>
            <text x="196" y="275" textAnchor="middle" className="bf-bordado-sub">
              PROMOCIÓN 2026
            </text>

            {/* bolígrafos y linterna */}
            <rect x="362" y="222" width="7" height="40" rx="3" fill="#1E3A8A" />
            <rect x="364" y="218" width="3" height="14" rx="1.5" fill="url(#bf-oro)" />
            <rect x="377" y="228" width="7" height="34" rx="3" fill="#0E7C86" />
            <rect x="391" y="226" width="6" height="36" rx="3" fill="url(#bf-metal)" />
            {/* bolsillo del pecho */}
            <path d="M350 250 L414 250 L412 304 Q382 310 352 304 Z" fill="#FFFFFF" stroke="#C3CED7" strokeWidth="1.5" />
            <path d="M355 256 L409 256" stroke="#D5DDE3" strokeWidth="1.2" strokeDasharray="3 3" />

            {/* bolsillos inferiores */}
            <path d="M172 486 L268 486 L266 578 Q220 586 174 578 Z" fill="url(#bf-telaL)" stroke="#C3CED7" strokeWidth="1.5" />
            <path d="M177 493 L263 493" stroke="#D5DDE3" strokeWidth="1.2" strokeDasharray="3 3" />
            <path d="M332 486 L428 486 L426 578 Q380 586 334 578 Z" fill="url(#bf-telaR)" stroke="#C3CED7" strokeWidth="1.5" />
            <path d="M337 493 L423 493" stroke="#D5DDE3" strokeWidth="1.2" strokeDasharray="3 3" />

            {/* botones */}
            {[372, 452, 532, 612, 692].map((y) => (
              <g key={y}>
                <circle cx="314" cy={y} r="5.6" fill="#FFFFFF" stroke="#B5C1CB" strokeWidth="1.3" />
                <circle cx="312.4" cy={y} r="0.9" fill="#9AA7B2" />
                <circle cx="315.6" cy={y} r="0.9" fill="#9AA7B2" />
              </g>
            ))}

            {/* estetoscopio */}
            <g filter="url(#bf-sombraSuave)">
              <path
                d="M284 368 C270 354 258 334 252 300 C240 230 246 150 262 92 C276 80 324 80 338 92 C354 150 362 220 352 282 C346 306 337 320 326 330"
                fill="none"
                stroke="#22313F"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path d="M326 330 L314 358 M326 330 L338 360" stroke="url(#bf-metal)" strokeWidth="4" strokeLinecap="round" />
              <circle cx="314" cy="361" r="4.5" fill="#22313F" />
              <circle cx="338" cy="363" r="4.5" fill="#22313F" />
              <circle cx="290" cy="382" r="16" fill="url(#bf-metal)" stroke="#8C99A5" strokeWidth="1.2" />
              <circle cx="290" cy="382" r="10.5" fill="#E6EBEF" stroke="#B5C1CB" strokeWidth="1" />
              <circle cx="286" cy="378" r="3" fill="#FFFFFF" opacity="0.9" />
            </g>
          </g>

          {/* estado vacío */}
          {firmas.length === 0 && (
            <text x="210" y="420" textAnchor="middle" className="bf-vacio">
              Sé el primero en firmar
            </text>
          )}

          {/* firmas */}
          <g className="bf-firmas">
            {firmas.map((f, i) => {
              const s = slots[i];
              if (!s) return null;
              const seed = hash(f.id);
              const tinta = f.color ?? TINTAS[seed % TINTAS.length];
              const delay = `${0.6 + i * 0.09}s`;
              const nuevo = f.id === resaltarId;
              const conCorazon = !f.trazo && seed % 5 === 0;
              const fs = Math.min(s.h * 0.82, s.w / (0.4 * Math.max(f.nombre.length, 6)));
              return (
                <g
                  key={f.id}
                  transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}
                  className={`bf-firma${activa === f.id ? ' is-activa' : ''}${nuevo ? ' is-nueva' : ''}`}
                  style={{ ['--d' as string]: delay }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Firma de ${f.nombre}${f.mensaje ? `: ${f.mensaje}` : ''}`}
                  onMouseEnter={() => setActiva(f.id)}
                  onMouseLeave={() => setActiva(null)}
                  onFocus={() => setActiva(f.id)}
                  onBlur={() => setActiva(null)}
                  onClick={() => setActiva((a) => (a === f.id ? null : f.id))}
                >
                  <g className="bf-firma-in">
                    {/* Área de toque ampliada (invisible) para que cada firma mida al menos 44 px en móvil. */}
                    <rect x={-s.w / 2 - 16} y={-s.h / 2 - 30} width={s.w + 32} height={s.h + 60} fill="transparent" />
                    {nuevo && (
                      <ellipse rx={s.w * 0.6} ry={s.h * 0.9} fill="#F1D77E" opacity="0.45" filter="url(#bf-brillo)" />
                    )}
                    {f.trazo ? (
                      <>
                        <g transform={`scale(${s.w / 300} ${s.h / 120}) translate(-150 -60)`}>
                          <path
                            d={f.trazo}
                            pathLength={1}
                            className="bf-trazo"
                            stroke={tinta}
                            strokeWidth={2.2}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </g>
                        <text y={s.h / 2 + 7} textAnchor="middle" className="bf-nombre-mini" fill={tinta}>
                          {f.nombre}
                        </text>
                      </>
                    ) : (
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="bf-nombre"
                        fill={tinta}
                        stroke={tinta}
                        style={{ fontSize: fs }}
                      >
                        {f.nombre}
                        {conCorazon && <tspan className="bf-corazon"> ♥</tspan>}
                      </text>
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* tarjeta flotante con el mensaje */}
        {firmaActiva && slotActivo && (
          <div
            className="bf-tip"
            style={{
              left: `${(slotActivo.x / W) * 100}%`,
              top: `${(slotActivo.y / H) * 100}%`,
            }}
            role="status"
          >
            <p className="bf-tip-nombre">{firmaActiva.nombre}</p>
            {firmaActiva.mensaje && <p className="bf-tip-msg">“{firmaActiva.mensaje}”</p>}
            {firmaActiva.fecha && <p className="bf-tip-fecha">{firmaActiva.fecha}</p>}
          </div>
        )}
      </div>

      <div className="bf-actions">
        <button type="button" className="bf-btn" onClick={onFirmar}>
          <span className="bf-btn-ico" aria-hidden>✍️</span> Firmar la bata
        </button>
        {onDescargar && (
          <button type="button" className="bf-btn-ghost" onClick={onDescargar}>
            Descargar la bata firmada
          </button>
        )}
      </div>
    </section>
  );
}

/* ────────────────────────── estilos ────────────────────────── */

const CSS = `
.bf-root{
  --bf-teal:#0E7C86; --bf-navy:#1E3A8A; --bf-gold:#C9A227; --bf-ink:#1F2937; --bf-muted:#6B7280;
  --bf-serif:var(--font-fraunces, 'Fraunces'), Georgia, serif;
  --bf-hand:var(--font-caveat, 'Caveat'), 'Segoe Script', cursive;
  --bf-sans:var(--font-manrope, 'Manrope'), system-ui, sans-serif;
  position:relative; overflow:hidden; isolation:isolate;
  padding:clamp(40px,7vw,88px) 20px clamp(48px,7vw,96px);
  background:#fff; font-family:var(--bf-sans); color:var(--bf-ink); text-align:center;
}
.bf-root::before{ /* grano de papel */
  content:""; position:absolute; inset:0; z-index:-1; opacity:.035; pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.bf-glow{position:absolute; z-index:-1; border-radius:50%; filter:blur(60px); pointer-events:none}
.bf-glow-a{width:520px;height:520px; left:50%; top:46%; transform:translate(-78%,-50%); background:radial-gradient(circle, rgba(14,124,134,.14), transparent 65%)}
.bf-glow-b{width:460px;height:460px; left:50%; top:58%; transform:translate(-10%,-50%); background:radial-gradient(circle, rgba(201,162,39,.16), transparent 65%)}

.bf-head{max-width:720px; margin:0 auto}
.bf-eyebrow{margin:0 0 10px; font-size:13px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:var(--bf-teal);
  opacity:0; animation:bf-up .8s cubic-bezier(.22,1,.36,1) .05s forwards}
.bf-title{margin:0; font-family:var(--bf-serif); font-weight:600; color:var(--bf-navy);
  font-size:clamp(36px,6.4vw,68px); line-height:1.02; letter-spacing:-.02em;
  opacity:0; animation:bf-up .9s cubic-bezier(.22,1,.36,1) .15s forwards}
.bf-shine{font-style:italic; font-weight:500;
  background:linear-gradient(100deg,#9C7A16 0%,#C9A227 30%,#F6E3A1 45%,#C9A227 60%,#9C7A16 100%);
  background-size:250% 100%; -webkit-background-clip:text; background-clip:text; color:transparent;
  animation:bf-shine 5s ease-in-out 1.2s infinite}
.bf-ecg{display:block; width:220px; height:28px; margin:14px auto 6px}
.bf-ecg path{fill:none; stroke:var(--bf-teal); stroke-width:2; stroke-linecap:round; stroke-linejoin:round;
  stroke-dasharray:1; stroke-dashoffset:1; animation:bf-draw 1.6s cubic-bezier(.65,0,.35,1) .5s forwards, bf-beat 2.4s ease-in-out 2.4s infinite}
.bf-count{margin:0; font-size:15px; color:var(--bf-muted); opacity:0; animation:bf-up .8s cubic-bezier(.22,1,.36,1) .35s forwards}
.bf-count strong{color:var(--bf-teal); font-size:17px}
@media (max-width:520px){.bf-count-extra{display:block; margin-top:4px} .bf-count-extra .bf-dot{display:none}}
.bf-dot{display:inline-block; width:4px; height:4px; border-radius:50%; background:var(--bf-gold); margin:0 10px 3px; vertical-align:middle}

.bf-stage{position:relative; width:min(560px,100%); margin:8px auto 0}
.bf-svg{display:block; width:100%; height:auto; overflow:visible}
.bf-coat{opacity:0; transform-origin:300px 40px; animation:bf-hang 1.4s cubic-bezier(.22,1,.36,1) .25s forwards}

.bf-bordado{font-family:var(--bf-hand); font-size:20px; font-weight:600; fill:var(--bf-teal)}
.bf-bordado-sub{font-family:var(--bf-sans); font-size:6.6px; font-weight:700; letter-spacing:.2em; fill:var(--bf-gold)}
.bf-vacio{font-family:var(--bf-hand); font-size:24px; fill:#9AA7B2; animation:bf-pulse 2.4s ease-in-out infinite}

.bf-firma{cursor:pointer; outline:none}
.bf-firma-in{transform-box:fill-box; transform-origin:center; transition:transform .35s cubic-bezier(.22,1,.36,1)}
.bf-firma:hover .bf-firma-in, .bf-firma.is-activa .bf-firma-in, .bf-firma:focus-visible .bf-firma-in{transform:scale(1.14)}
.bf-firmas:has(.bf-firma.is-activa) .bf-firma:not(.is-activa){opacity:.35; transition:opacity .3s}
.bf-nombre{font-family:var(--bf-hand); font-weight:600; stroke-width:.6; fill-opacity:0;
  stroke-dasharray:420; stroke-dashoffset:420;
  animation:bf-write 1.5s cubic-bezier(.5,0,.3,1) var(--d) forwards, bf-ink .6s ease var(--d) forwards}
.bf-nombre-mini{font-family:var(--bf-sans); font-size:7px; font-weight:600; letter-spacing:.06em; opacity:0; animation:bf-fade .6s ease calc(var(--d) + 1s) forwards}
.bf-trazo{stroke-dasharray:1; stroke-dashoffset:1; animation:bf-draw 1.6s cubic-bezier(.5,0,.3,1) var(--d) forwards}
.bf-corazon{fill:#E26D8D; stroke:none}
.bf-firma.is-nueva .bf-firma-in{animation:bf-pop 1s cubic-bezier(.22,1,.36,1) var(--d) both}

.bf-tip{position:absolute; z-index:5; transform:translate(-50%, calc(-100% - 18px)); pointer-events:none;
  min-width:170px; max-width:240px; padding:12px 16px 10px; background:#fff; border-radius:14px; text-align:left;
  box-shadow:0 1px 2px rgba(15,42,58,.08), 0 12px 32px rgba(15,42,58,.14); border:1px solid rgba(201,162,39,.35);
  animation:bf-tip .28s cubic-bezier(.22,1,.36,1)}
.bf-tip::after{content:""; position:absolute; left:50%; bottom:-7px; width:12px; height:12px; background:#fff;
  border-right:1px solid rgba(201,162,39,.35); border-bottom:1px solid rgba(201,162,39,.35); transform:translateX(-50%) rotate(45deg)}
.bf-tip-nombre{margin:0; font-family:var(--bf-serif); font-weight:600; font-size:16px; color:var(--bf-navy)}
.bf-tip-msg{margin:4px 0 0; font-family:var(--bf-hand); font-size:20px; line-height:1.15; color:var(--bf-ink)}
.bf-tip-fecha{margin:6px 0 0; font-size:11px; color:var(--bf-muted); letter-spacing:.04em}

.bf-actions{display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:clamp(8px,2vw,20px);
  opacity:0; animation:bf-up .8s cubic-bezier(.22,1,.36,1) 1.1s forwards}
.bf-btn{position:relative; overflow:hidden; display:inline-flex; align-items:center; gap:10px; border:0; cursor:pointer;
  padding:16px 30px; border-radius:999px; font:600 17px/1 var(--bf-sans); color:#fff;
  background:linear-gradient(135deg,#0E7C86,#0B6870); box-shadow:0 0 0 3px #fff, 0 0 0 4.5px rgba(201,162,39,.55), 0 10px 26px rgba(14,124,134,.32);
  transition:transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s}
.bf-btn::after{content:""; position:absolute; inset:0; background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);
  transform:translateX(-120%); animation:bf-sweep 3.6s ease-in-out 2s infinite}
.bf-btn:hover{transform:translateY(-2px) scale(1.02); box-shadow:0 0 0 3px #fff, 0 0 0 4.5px rgba(201,162,39,.8), 0 16px 34px rgba(14,124,134,.38)}
.bf-btn:active{transform:scale(.98)}
.bf-btn-ico{display:inline-block; animation:bf-wiggle 3.6s ease-in-out 2s infinite}
.bf-btn-ghost{border:1.5px solid rgba(14,124,134,.35); background:#fff; color:var(--bf-teal); cursor:pointer;
  padding:15px 24px; border-radius:999px; font:600 15px/1 var(--bf-sans); transition:background .25s, border-color .25s}
.bf-btn-ghost:hover{background:rgba(14,124,134,.06); border-color:var(--bf-teal)}

@keyframes bf-up{from{opacity:0; transform:translateY(18px)} to{opacity:1; transform:none}}
@keyframes bf-fade{to{opacity:1}}
@keyframes bf-draw{to{stroke-dashoffset:0}}
@keyframes bf-write{to{stroke-dashoffset:0}}
@keyframes bf-ink{0%{fill-opacity:0} 60%{fill-opacity:0} 100%{fill-opacity:1}}
@keyframes bf-hang{0%{opacity:0; transform:translateY(-26px) rotate(-3deg)} 55%{opacity:1; transform:translateY(4px) rotate(1.2deg)} 78%{transform:rotate(-.5deg)} 100%{opacity:1; transform:none}}
@keyframes bf-beat{0%,100%{stroke-width:2} 10%{stroke-width:3} 20%{stroke-width:2}}
@keyframes bf-shine{0%,100%{background-position:100% 0} 50%{background-position:0 0}}
@keyframes bf-pop{0%{transform:scale(.4); opacity:0} 60%{transform:scale(1.25); opacity:1} 100%{transform:scale(1)}}
@keyframes bf-pulse{0%,100%{opacity:.5} 50%{opacity:1}}
@keyframes bf-tip{from{opacity:0; transform:translate(-50%, calc(-100% - 8px)) scale(.96)} to{opacity:1; transform:translate(-50%, calc(-100% - 18px))}}
@keyframes bf-sweep{0%,60%{transform:translateX(-120%)} 100%{transform:translateX(120%)}}
@keyframes bf-wiggle{0%,70%,100%{transform:rotate(0)} 76%{transform:rotate(-14deg)} 82%{transform:rotate(10deg)} 88%{transform:rotate(-6deg)}}

@media (prefers-reduced-motion: reduce){
  .bf-root *, .bf-root *::before, .bf-root *::after{animation-duration:.01ms !important; animation-delay:0s !important; animation-iteration-count:1 !important}
  .bf-nombre{stroke-dashoffset:0; fill-opacity:1}
}
`;
