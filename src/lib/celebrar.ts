// Animación de confeti para cuando algo se publica con éxito. Se carga solo cuando hace falta
// y no se muestra si la persona pidió reducir el movimiento.
const COLORES = ["#0E7C86", "#C9A227", "#F4A7B9"];

export async function celebrar(intensidad: "suave" | "fiesta" = "suave"): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  if (intensidad === "fiesta") {
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors: COLORES });
    setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { x: 0.1, y: 0.8 }, colors: COLORES }), 250);
    setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { x: 0.9, y: 0.8 }, colors: COLORES }), 450);
    return;
  }
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: COLORES });
}
