"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Frases y momentos que se leen dentro del libro. Se pueden cambiar aquí.
const PAGINAS = [
  { frase: "Cinco años de madrugadas, cafés y parciales.", momento: "Primer día de clases" },
  { frase: "Nadie nace sabiendo suturar. Todos aprendimos a sostener la aguja.", momento: "Práctica en el laboratorio" },
  { frase: "Cada latido cuenta, y cada compañero también.", momento: "Noches de estudio" },
  { frase: "Hoy nos ponemos la bata.", momento: "5 de diciembre de 2026" },
];

// Intro: un libro de tapa de cuero se ilumina con lámina dorada, cae un sello de lacre, la tapa se abre,
// y después pasan páginas con fotos, frases y momentos. Se puede saltar en cualquier momento.
export function IntroBook({ title, fotos = [] }: { title: string; fotos?: string[] }) {
  const [fase, setFase] = useState<"off" | "entra" | "sello" | "abre" | "pasa" | "sale">("off");
  const [pagina, setPagina] = useState(0);
  // Temporizadores de la secuencia: "Saltar intro" los cancela, si no vuelven a mostrar la intro.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Mientras una hoja gira, guarda la página que se está volteando.
  const [volteo, setVolteo] = useState<number | null>(null);

  useEffect(() => {
    // Siempre se muestra en cada visita. Solo se omite si el sistema pide reducir movimiento.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    setFase("entra");
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setFase("sello"), 1100),
      setTimeout(() => setFase("abre"), 2300),
      setTimeout(() => setFase("pasa"), 3900),
    ];
    // Cada cambio de página: la hoja vieja (página i-1) gira mientras la nueva aparece debajo.
    // Se cambian página y hoja en el mismo momento para que nunca se vea el mismo texto dos veces.
    PAGINAS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        if (i > 0) setVolteo(i - 1);
        setPagina(i);
        if (i > 0) timers.push(setTimeout(() => setVolteo(null), 1300));
      }, 3900 + i * 2300));
    });
    timers.push(setTimeout(() => setFase("sale"), 3900 + PAGINAS.length * 2300 + 200));
    timers.push(setTimeout(() => setFase("off"), 3900 + PAGINAS.length * 2300 + 900));
    timersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, []);

  const saltar = () => {
    timersRef.current.forEach(clearTimeout);
    setFase("off");
  };

  if (fase === "off") return null;

  const abierto = fase === "abre" || fase === "pasa" || fase === "sale";
  const libro = fase === "entra" || fase === "sello" || fase === "abre";
  // Lado derecho de una doble página: cada página tiene su propia foto, sin repetir.
  // Si no hay foto para esa página, se muestra una polaroid vacía con invitación.
  const fotoDe = (i: number) => {
    const src = fotos[i] ?? null;
    return src ? (
      <div className="bb-intro-polaroid">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-auto w-full" />
      </div>
    ) : (
      <div className="bb-intro-polaroid bb-intro-vacia">
        <p className="font-hand text-2xl text-[#4B5563]">Tu foto aquí 📸</p>
      </div>
    );
  };
  // Texto de la página izquierda: mientras gira una hoja, sigue mostrando la página anterior.
  const textoIzq = volteo ?? pagina;

  return createPortal(
    <div
      className={`fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-white transition-opacity duration-700 ${fase === "sale" ? "opacity-0" : "opacity-100"}`}
      role="dialog"
      aria-label="Introducción"
    >
      <style>{INTRO_CSS}</style>

      {libro && (
        <div className="bb-intro-stage">
          <div className={`bb-intro-book is-in`}>
            <div className="bb-intro-pages" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
            <div className={`bb-intro-leaf ${abierto ? "is-flip" : ""}`} aria-hidden="true" />
            <div className={`bb-intro-cover ${abierto ? "is-open" : ""}`}>
              <div className="bb-intro-front">
                <span className="bb-intro-foil" aria-hidden="true" />
                <svg viewBox="0 0 120 150" className="bb-intro-orn" aria-hidden="true">
                  <path d="M60 12 L72 26 L60 40 L48 26 Z M60 110 L72 124 L60 138 L48 124 Z" fill="none" stroke="#C9A227" strokeWidth="1.4" />
                  <rect x="8" y="8" width="104" height="134" rx="4" fill="none" stroke="#C9A227" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
                </svg>
                <p className="bb-intro-title">{title}</p>
                <p className="bb-intro-sub">Universidad de Sucre · 2026</p>
                <div className={`bb-intro-seal ${fase !== "entra" ? "is-stamped" : ""} ${abierto ? "is-cracked" : ""}`} aria-hidden="true">
                  <span>✚</span>
                  <i className="bb-intro-ring" />
                </div>
              </div>
              <div className="bb-intro-back" aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {fase === "pasa" && (
        <div className="bb-intro-spread">
          <div className="bb-intro-page bb-intro-page-izq">
            <p className="bb-intro-momento">{PAGINAS[textoIzq].momento}</p>
            <p className="bb-intro-frase">{PAGINAS[textoIzq].frase}</p>
            <span className="bb-intro-folio" aria-hidden="true">{textoIzq * 2 + 1}</span>
          </div>
          <div className="bb-intro-page bb-intro-page-der">
            {fotoDe(pagina)}
            <span className="bb-intro-folio" aria-hidden="true">{pagina * 2 + 2}</span>
          </div>
          {volteo !== null && (
            <div key={`hoja-${pagina}`} className="bb-leaf" aria-hidden="true">
              <div className="bb-leaf-face">
                {fotoDe(volteo)}
                <span className="bb-leaf-shade" />
              </div>
              <div className="bb-leaf-back">
                <div className="bb-intro-page bb-intro-page-izq">
                  <p className="bb-intro-momento">{PAGINAS[pagina].momento}</p>
                  <p className="bb-intro-frase">{PAGINAS[pagina].frase}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={saltar} className="mt-10 min-h-11 rounded-full px-5 text-sm text-muted underline underline-offset-4 hover:text-primary">
        Saltar intro
      </button>
    </div>,
    document.body,
  );
}

const INTRO_CSS = `
.bb-intro-stage{perspective:1600px; perspective-origin:50% 40%; width:min(360px,80vw); aspect-ratio:3/4.1; position:relative}
.bb-intro-book{position:absolute; inset:0; transform-style:preserve-3d; opacity:0; transform:translateY(46px) rotateX(10deg) scale(.96);
  transition:opacity .9s cubic-bezier(.22,1,.36,1), transform 1.1s cubic-bezier(.22,1,.36,1)}
.bb-intro-book.is-in{opacity:1; transform:none}
.bb-intro-pages{position:absolute; top:4%; bottom:4%; left:3%; right:1%; transform:translateZ(-14px); border-radius:2px;
  background:repeating-linear-gradient(90deg,#fbfbfa 0 2px,#e9e7e2 2px 3px); box-shadow:0 30px 60px rgba(15,42,58,.22)}
.bb-intro-pages span{position:absolute; inset:0; background:#fdfdfc; border-radius:2px}
.bb-intro-pages span:nth-child(1){transform:translate(3px,1px)} .bb-intro-pages span:nth-child(2){transform:translate(6px,2px)}
.bb-intro-pages span:nth-child(3){transform:translate(9px,3px)} .bb-intro-pages span:nth-child(4){transform:translate(12px,4px)}
.bb-intro-leaf{position:absolute; top:6%; bottom:6%; left:4%; right:4%; transform-origin:left center; transform:translateZ(-8px);
  background:linear-gradient(90deg,#fff,#f6f5f1); border-radius:2px; opacity:0}
.bb-intro-leaf.is-flip{animation:bb-intro-leaf 1.2s .25s cubic-bezier(.45,0,.2,1) forwards}
@keyframes bb-intro-leaf{0%{transform:translateZ(-8px) rotateY(0); opacity:1} 100%{transform:translateZ(-8px) rotateY(-168deg); opacity:0}}
.bb-intro-cover{position:absolute; inset:0; transform-origin:left center; transform-style:preserve-3d; transition:transform 1.5s cubic-bezier(.65,0,.35,1); will-change:transform}
.bb-intro-cover.is-open{transform:rotateY(-164deg)}
.bb-intro-front,.bb-intro-back{position:absolute; inset:0; border-radius:4px 10px 10px 4px; backface-visibility:hidden; overflow:hidden}
.bb-intro-front{background:radial-gradient(120% 90% at 30% 20%, #17868f 0%, #0E7C86 45%, #0B5F67 100%);
  box-shadow:inset 6px 0 10px rgba(0,0,0,.25), inset -1px 0 0 rgba(255,255,255,.12), 0 1px 2px rgba(15,42,58,.2)}
.bb-intro-back{transform:rotateY(180deg); background:linear-gradient(90deg,#f3f1ec,#fffdf8); box-shadow:inset 0 0 0 1px #e6e1d6}
.bb-intro-foil{position:absolute; inset:-40%; background:linear-gradient(110deg,transparent 40%,rgba(241,215,126,.6) 50%,transparent 60%);
  transform:translate3d(-100%,0,0); animation:bb-intro-foil 1.3s .5s cubic-bezier(.4,0,.2,1) forwards; will-change:transform}
@keyframes bb-intro-foil{to{transform:translate3d(100%,0,0)}}
.bb-intro-orn{position:absolute; inset:0; width:100%; height:100%; opacity:.9}
.bb-intro-title{position:absolute; top:43%; left:0; right:0; margin:0; text-align:center; font-family:var(--font-display), Georgia, serif;
  font-size:34px; line-height:1; color:#F1D77E; text-shadow:0 1px 0 rgba(0,0,0,.35); letter-spacing:.01em}
.bb-intro-sub{position:absolute; top:62%; left:0; right:0; margin:0; text-align:center; font-family:var(--font-hand), cursive; font-size:19px; color:#D8F0F0}
.bb-intro-seal{position:absolute; left:50%; top:20%; width:86px; height:86px; margin:-43px 0 0 -43px; border-radius:50%;
  display:flex; align-items:center; justify-content:center; font-family:var(--font-display), Georgia, serif; font-size:30px; color:#5b4608;
  background:radial-gradient(circle at 35% 30%, #F6E3A1 0%, #C9A227 50%, #8A6A12 100%);
  box-shadow:0 10px 20px rgba(0,0,0,.35), inset 0 -3px 6px rgba(0,0,0,.25); opacity:0; transform:scale(2.2) rotate(-18deg)}
.bb-intro-seal.is-stamped{opacity:1; transform:scale(1) rotate(-6deg); transition:transform .45s cubic-bezier(.3,1.6,.5,1), opacity .2s}
.bb-intro-seal.is-cracked{opacity:0; transform:scale(1.25) rotate(8deg); transition:transform .35s ease-out, opacity .35s ease-out}
.bb-intro-ring{position:absolute; inset:-6px; border-radius:50%; border:2px solid #C9A227; opacity:0}
.bb-intro-seal.is-stamped .bb-intro-ring{animation:bb-intro-ring .9s .35s ease-out forwards}
@keyframes bb-intro-ring{0%{transform:scale(1); opacity:.9} 100%{transform:scale(1.9); opacity:0}}

/* Páginas abiertas: una doble página que se pasa cada 2,3 segundos */
.bb-intro-spread{position:relative; display:grid; grid-template-columns:1fr 1fr; width:min(760px,94vw); aspect-ratio:1.45/1;
  background:#fff; border-radius:4px; box-shadow:0 2px 4px rgba(15,42,58,.08), 0 24px 60px rgba(15,42,58,.16);
  animation:bb-intro-spread .7s cubic-bezier(.22,1,.36,1) both}
.bb-intro-spread::after{content:""; position:absolute; left:50%; top:0; bottom:0; width:40px; margin-left:-20px; pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(30,58,138,.10),transparent)}
.bb-intro-page{position:relative; padding:clamp(28px,12%,88px) clamp(20px,4vw,48px) clamp(20px,4vw,48px); display:flex; flex-direction:column; justify-content:flex-start; align-items:center; text-align:center; gap:14px}

/* Hoja que gira sobre el lomo, como una página de verdad */
.bb-intro-spread{perspective:1800px}
.bb-leaf{position:absolute; top:0; bottom:0; left:50%; width:50%; transform-origin:left center; transform-style:preserve-3d;
  animation:bb-turn 1.1s cubic-bezier(.4,.1,.2,1) forwards; z-index:2; pointer-events:none; will-change:transform}
.bb-leaf-face,.bb-leaf-back{position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; background:#fff; overflow:hidden}
.bb-leaf-face{display:flex; flex-direction:column; justify-content:center; padding:clamp(20px,4vw,48px); box-shadow:inset 10px 0 14px -10px rgba(15,42,58,.18)}
.bb-leaf-back{transform:rotateY(180deg); box-shadow:inset -10px 0 14px -10px rgba(15,42,58,.18)}
.bb-leaf-shade{position:absolute; inset:0; background:linear-gradient(90deg,rgba(15,42,58,0),rgba(15,42,58,.28) 60%,rgba(15,42,58,0)); opacity:0; animation:bb-shade 1.25s forwards}
@keyframes bb-turn{from{transform:rotateY(0deg)} to{transform:rotateY(-180deg)}}
@keyframes bb-shade{0%{opacity:0} 45%{opacity:1} 100%{opacity:0}}
.bb-intro-momento{margin:0; font-family:var(--font-hand), cursive; font-size:22px; color:var(--bb-primary, #0E7C86)}
.bb-intro-frase{margin:0; font-family:var(--font-display), Georgia, serif; font-size:clamp(20px,3vw,30px); line-height:1.25; color:var(--bb-secondary, #1E3A8A)}
.bb-intro-polaroid{background:#fff; padding:12px 12px 36px; box-shadow:0 2px 4px rgba(15,42,58,.1), 0 14px 30px rgba(15,42,58,.14);
  transform:rotate(-2.5deg); align-self:center; width:min(100%,300px)}
.bb-intro-polaroid img{display:block; width:100%; aspect-ratio:1/1; object-fit:cover}
.bb-intro-vacia{aspect-ratio:1/1; display:flex; align-items:center; justify-content:center; text-align:center; padding:24px; background:#F4F7F8}
.bb-intro-folio{position:absolute; bottom:14px; font-size:12px; color:#9aa3ad; font-variant-numeric:tabular-nums}
.bb-intro-page-izq .bb-intro-folio{left:20px} .bb-intro-page-der .bb-intro-folio{right:20px}
@keyframes bb-intro-spread{from{opacity:0; transform:scale(.97)} to{opacity:1; transform:none}}
@keyframes bb-intro-pasa{from{opacity:0; transform:perspective(1400px) rotateY(-68deg)} to{opacity:1; transform:none}}
@media (max-width:640px){
  .bb-intro-spread{grid-template-columns:1fr; aspect-ratio:auto; width:min(92vw,420px)}
  .bb-intro-spread::after{display:none}
  .bb-intro-page-der{order:-1}
  .bb-leaf{left:0; width:100%}
  .bb-intro-folio{display:none}
}
@media (prefers-reduced-motion: reduce){ .bb-intro-book,.bb-intro-cover,.bb-intro-seal,.bb-intro-foil,.bb-intro-leaf,.bb-intro-spread,.bb-intro-page{transition:none!important; animation:none!important} }
`;
