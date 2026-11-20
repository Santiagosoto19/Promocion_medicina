"use client";

import { useActionState, useState } from "react";
import { saveTheme, type ThemeState } from "./actions";
import { THEME_PRESETS, type ThemeColors } from "@/lib/themes";

export function ThemeForm({ presets, current }: { presets: { key: string; label: string }[]; current: ThemeColors }) {
  const [state, formAction, pending] = useActionState<ThemeState, FormData>(saveTheme, undefined);
  const [preset, setPreset] = useState("personalizado");
  const [colors, setColors] = useState<ThemeColors>(current);

  function choose(key: string) {
    setPreset(key);
    if (key in THEME_PRESETS) {
      const p = THEME_PRESETS[key as keyof typeof THEME_PRESETS];
      setColors({ primary: p.primary, secondary: p.secondary, gold: p.gold, rose: p.rose });
    }
  }

  const rows: { key: keyof ThemeColors; label: string }[] = [
    { key: "primary", label: "Primario (botones y acentos)" },
    { key: "secondary", label: "Secundario (títulos)" },
    { key: "gold", label: "Dorado (sellos y detalles)" },
    { key: "rose", label: "Rosa (reacciones y detalles)" },
  ];

  return (
    <form action={formAction} className="space-y-5 paper-card p-5">
      <fieldset className="space-y-2">
        <legend className="text-sm text-text">Preset</legend>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <label key={p.key} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary/10">
              <input type="radio" name="preset" value={p.key} checked={preset === p.key} onChange={() => choose(p.key)} className="sr-only" />
              {p.label}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary/10">
            <input type="radio" name="preset" value="personalizado" checked={preset === "personalizado"} onChange={() => choose("personalizado")} className="sr-only" />
            Colores propios
          </label>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((r) => (
          <label key={r.key} className="block">
            <span className="bb-label">{r.label}</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                name={r.key}
                value={colors[r.key]}
                onChange={(e) => {
                  setPreset("personalizado");
                  setColors((c) => ({ ...c, [r.key]: e.target.value }));
                }}
                className="h-10 w-12 cursor-pointer rounded border border-line bg-paper"
              />
              <span className="font-mono text-xs text-muted">{colors[r.key]}</span>
            </div>
          </label>
        ))}
      </div>

      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-primary">Tema guardado.</p>}

      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:brightness-110 disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar tema"}
      </button>
    </form>
  );
}
