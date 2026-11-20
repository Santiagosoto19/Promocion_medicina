import type { ReactNode } from "react";
import { tiltFor } from "@/lib/tilt";

// Marco de polaroid con giro propio y cinta washi. Se usa en servidor y en cliente.
export function Polaroid({
  id,
  children,
  caption,
  tape = true,
  className = "",
}: {
  id: string;
  children: ReactNode;
  caption?: ReactNode;
  tape?: boolean;
  className?: string;
}) {
  const { rotate, tapeLeft } = tiltFor(id);
  return (
    <div className={`polaroid relative ${className}`} style={{ ["--rot" as string]: `${rotate}deg` }}>
      {tape && (
        <span
          className="washi"
          aria-hidden="true"
          style={{
            top: -12,
            left: tapeLeft ? -22 : undefined,
            right: tapeLeft ? undefined : -22,
            transform: `rotate(${tapeLeft ? -14 : 14}deg)`,
          }}
        />
      )}
      {children}
      <div className="polaroid-caption text-center font-hand text-xl leading-tight text-text">{caption ?? null}</div>
    </div>
  );
}
