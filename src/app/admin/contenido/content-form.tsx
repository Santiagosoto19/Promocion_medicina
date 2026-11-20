"use client";

import { useActionState } from "react";
import type { ContentState } from "./actions";

type Initial = { heroTitle: string; heroSubtitle: string; playlistUrl: string; guestsEnabled: boolean; capsuleOpenAt: string; mosaicTargetPath: string };

const field = "bb-input";

export function ContentForm({
  action,
  initial,
  photos,
}: {
  action: (prev: ContentState, formData: FormData) => Promise<ContentState>;
  initial: Initial;
  photos: { path: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState<ContentState, FormData>(action, undefined);
  return (
    <form action={formAction} className="space-y-5 paper-card p-5">
      <label className="block"><span className="bb-label">Título de la portada</span><input name="heroTitle" defaultValue={initial.heroTitle} maxLength={120} placeholder="Bata Blanca" className={field} /></label>
      <label className="block"><span className="bb-label">Subtítulo</span><input name="heroSubtitle" defaultValue={initial.heroSubtitle} maxLength={160} placeholder="Los recuerdos de la promoción" className={field} /></label>
      <label className="block"><span className="bb-label">Playlist (Spotify o YouTube, opcional)</span><input name="playlistUrl" defaultValue={initial.playlistUrl} placeholder="https://open.spotify.com/playlist/…" className={field} /></label>
      <label className="block"><span className="bb-label">Fecha de apertura de la cápsula del tiempo (hora de Colombia)</span><input name="capsuleOpenAt" type="datetime-local" defaultValue={initial.capsuleOpenAt} className={field} /></label>
      <label className="block">
        <span className="bb-label">Foto para el fotomosaico</span>
        <select name="mosaicTargetPath" defaultValue={initial.mosaicTargetPath} className={field}>
          <option value="">Sin foto objetivo</option>
          {photos.map((p) => (
            <option key={p.path} value={p.path}>{p.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-start gap-3">
        <input name="guestsEnabled" type="checkbox" defaultChecked={initial.guestsEnabled} className="mt-1 h-4 w-4 accent-primary" />
        <span className="bb-label">Abrir el libro de visitas a familiares e invitados (los mensajes se revisan antes de publicarse)</span>
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-primary">Contenido guardado.</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:brightness-110 disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
