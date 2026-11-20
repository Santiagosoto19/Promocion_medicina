// Separador entre secciones: una línea ECG que se dibuja y late suavemente.
export function EcgDivider({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 40" className={`mx-auto h-10 w-full max-w-md ${className}`} aria-hidden="true">
      <path className="ecg-line" pathLength={1} d="M0 22 H150 l12 0 l7 -16 l9 32 l8 -26 l6 10 H260 l8 -6 l7 6 H400" />
    </svg>
  );
}
