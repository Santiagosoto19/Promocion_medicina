import { Adn, Corazon, CruzMedica, Estetoscopio, Frasco, Jeringa, Pildora, Termometro } from "./icons";
import { Esculapio } from "@/components/clasico/ornamentos";

// Vara de Esculapio (símbolo de la medicina) con el tamaño que esperan las figuras flotantes.
const EsculapioFlotante = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <Esculapio alto={size} className={className} />
);

// Decoración flotante detrás del contenido: ilustraciones médicas tenues, sin bloquear clics.
const PIECES = [
  { C: Pildora, x: 4, y: 12, s: 56, c: "text-primary/30", cls: "med-float", r: "-12deg", d: "0s" },
  { C: Jeringa, x: 90, y: 8, s: 64, c: "text-gold/40", cls: "med-float", r: "20deg", d: "1.2s" },
  { C: Adn, x: 86, y: 58, s: 72, c: "text-primary/25 med-spin", cls: "", r: "0deg", d: "0s" },
  { C: Corazon, x: 6, y: 66, s: 56, c: "text-rose/50 med-beat", cls: "", r: "0deg", d: "0s" },
  { C: CruzMedica, x: 50, y: 4, s: 36, c: "text-primary/25", cls: "med-float", r: "0deg", d: "2s" },
  { C: Estetoscopio, x: 12, y: 40, s: 60, c: "text-secondary/20", cls: "med-float", r: "8deg", d: "0.6s" },
  { C: EsculapioFlotante, x: 80, y: 88, s: 56, c: "text-gold/35", cls: "med-float", r: "-6deg", d: "1.8s" },
  { C: Frasco, x: 40, y: 92, s: 48, c: "text-primary/25", cls: "med-float", r: "10deg", d: "3s" },
  { C: Termometro, x: 62, y: 30, s: 44, c: "text-secondary/25", cls: "med-float", r: "-16deg", d: "2.4s" },
];

export function MedicalFloaters() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={`absolute ${p.c} ${p.cls}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, ["--r0" as string]: p.r, animationDelay: p.d }}
        >
          <p.C size={p.s} />
        </span>
      ))}
    </div>
  );
}
