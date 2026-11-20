// Se muestra al instante al cambiar de página, mientras el servidor arma la siguiente.
// Así el cambio se siente inmediato en vez de quedarse en blanco.
export default function Cargando() {
  return (
    <main className="min-h-dvh bg-paper px-4 py-10" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-2xl">
        <p className="text-center font-hand text-2xl text-primary">Abriendo el libro…</p>
        <div className="paper-card mt-8 space-y-4 p-6" aria-hidden="true">
          <div className="h-6 w-2/3 animate-pulse rounded-md bg-line" />
          <div className="h-4 w-full animate-pulse rounded-md bg-line" />
          <div className="h-4 w-5/6 animate-pulse rounded-md bg-line" />
          <div className="mt-6 h-48 w-full animate-pulse rounded-xl bg-line" />
        </div>
      </div>
    </main>
  );
}
