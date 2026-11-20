"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="mb-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:brightness-110">
      Imprimir o guardar como PDF
    </button>
  );
}
