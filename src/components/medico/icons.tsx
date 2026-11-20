// Ilustraciones médicas en línea fina (decorativas, sin texto clínico). Se colorean con currentColor.
type P = { size?: number; className?: string };
const base = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true as const,
});

export function Pildora({ size = 48, className = "" }: P) {
  return (
    <svg {...base(size, className)}>
      <rect x="6" y="24" width="52" height="16" rx="8" transform="rotate(-35 32 32)" />
      <line x1="32" y1="14" x2="32" y2="50" transform="rotate(-35 32 32)" />
    </svg>
  );
}

export function Jeringa({ size = 48, className = "" }: P) {
  return (
    <svg {...base(size, className)}>
      <rect x="22" y="14" width="12" height="30" rx="2" transform="rotate(45 28 29)" />
      <line x1="28" y1="6" x2="40" y2="6" transform="rotate(45 28 29)" />
      <line x1="34" y1="38" x2="40" y2="32" transform="rotate(45 28 29)" />
      <line x1="10" y1="54" x2="20" y2="44" />
      <line x1="13" y1="48" x2="16" y2="51" />
    </svg>
  );
}

export function Caduceo({ size = 48, className = "" }: P) {
  return (
    <svg {...base(size, className)}>
      <line x1="32" y1="8" x2="32" y2="56" />
      <circle cx="32" cy="8" r="3" />
      <path d="M32 18 C 18 22, 46 28, 32 34 C 18 40, 46 46, 32 52" />
      <path d="M26 56 H38" />
      <path d="M32 14 C 26 6, 24 4, 20 6 M32 14 C 38 6, 40 4, 44 6" />
    </svg>
  );
}

export function Adn({ size = 48, className = "" }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M18 6 C 46 18, 18 28, 46 40 S 18 52, 46 58" />
      <path d="M46 6 C 18 18, 46 28, 18 40 S 46 52, 18 58" />
      <line x1="22" y1="13" x2="42" y2="13" />
      <line x1="25" y1="24" x2="39" y2="24" />
      <line x1="25" y1="40" x2="39" y2="40" />
      <line x1="22" y1="51" x2="42" y2="51" />
    </svg>
  );
}

export function Corazon({ size = 48, className = "" }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M32 54 C 12 40, 6 30, 6 22 C 6 14, 12 8, 20 8 C 26 8, 30 12, 32 16 C 34 12, 38 8, 44 8 C 52 8, 58 14, 58 22 C 58 30, 52 40, 32 54 Z" />
      <path d="M8 32 H22 L26 24 L32 40 L36 28 L40 32 H56" />
    </svg>
  );
}

export function Estetoscopio({ size = 48, className = "" }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M14 8 C 8 8, 8 22, 14 30 C 18 36, 26 36, 28 30" />
      <path d="M42 8 C 48 8, 48 22, 42 30 C 38 36, 30 36, 28 30" />
      <path d="M28 30 V 40 C 28 48, 36 50, 40 44" />
      <circle cx="46" cy="46" r="6" />
    </svg>
  );
}

export function CruzMedica({ size = 48, className = "" }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M24 8 H40 V24 H56 V40 H40 V56 H24 V40 H8 V24 H24 Z" />
    </svg>
  );
}

export function Frasco({ size = 48, className = "" }: P) {
  return (
    <svg {...base(size, className)}>
      <rect x="22" y="6" width="20" height="8" rx="2" />
      <path d="M24 14 V22 C 14 26, 12 32, 12 40 V 52 C 12 56, 14 58, 18 58 H 46 C 50 58, 52 56, 52 52 V 40 C 52 32, 50 26, 40 22 V 14" />
      <path d="M18 38 H46" />
      <path d="M26 34 H38" />
    </svg>
  );
}

export function Termometro({ size = 48, className = "" }: P) {
  return (
    <svg {...base(size, className)}>
      <rect x="26" y="6" width="12" height="36" rx="6" />
      <circle cx="32" cy="48" r="9" />
      <line x1="32" y1="18" x2="32" y2="42" />
      <line x1="38" y1="16" x2="42" y2="16" />
      <line x1="38" y1="24" x2="42" y2="24" />
      <line x1="38" y1="32" x2="42" y2="32" />
    </svg>
  );
}
