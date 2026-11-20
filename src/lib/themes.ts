// Temas del sitio. Solo colores: nunca se usan logos ni escudos oficiales.
export const THEME_PRESETS = {
  clinico: { label: "Clínico (teal + dorado)", primary: "#0E7C86", secondary: "#1E3A8A", gold: "#C9A227", rose: "#F4A7B9" },
  gala: { label: "Gala nocturna (azul + dorado)", primary: "#1E3A8A", secondary: "#0B1F4D", gold: "#C9A227", rose: "#F4A7B9" },
  rosa: { label: "Rosa pastel", primary: "#B5476E", secondary: "#6B2C45", gold: "#C9A227", rose: "#F7C6D3" },
} as const;

export type PresetKey = keyof typeof THEME_PRESETS | "personalizado";
export type ThemeColors = { primary: string; secondary: string; gold: string; rose: string };

export const HEX = /^#[0-9a-fA-F]{6}$/;

// Convierte la configuración guardada en colores válidos; cualquier valor raro vuelve al clínico.
export function resolveTheme(raw: Record<string, string> | null | undefined): ThemeColors {
  const base = THEME_PRESETS.clinico;
  const pick = (k: keyof ThemeColors) => (raw && HEX.test(raw[k] ?? "") ? raw[k] : base[k]);
  return { primary: pick("primary"), secondary: pick("secondary"), gold: pick("gold"), rose: pick("rose") };
}
