import type { Metadata, Viewport } from "next";
import { Caveat, Cinzel, Fraunces, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/access";
import { resolveTheme } from "@/lib/themes";
import { AppFooter } from "@/components/app-footer";
import { EasterEgg } from "@/components/easter-egg";
import { SiteNav } from "@/components/site-nav";
import { ToastProvider } from "@/components/ui/toast";
import { CursorDot } from "@/components/cursor-dot";
import { PublicTabBar } from "@/components/public-tab-bar";
import { AutoActualizar } from "@/components/auto-actualizar";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
// Inscripciones tipo lápida romana: títulos de ceremonia, medallón y citas.
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bata Blanca · Medicina · Universidad de Sucre",
  description: "Libro de recuerdos digital de la promoción de Medicina.",
  // Sitio privado: no aparece en buscadores.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  const t = resolveTheme(settings.theme);
  return (
    <html
      lang="es-CO"
      className={`${fraunces.variable} ${manrope.variable} ${caveat.variable} ${cinzel.variable} ${jetbrains.variable}`}
    >
      <head>
        <style>{`:root{--bb-primary:${t.primary};--bb-secondary:${t.secondary};--bb-gold:${t.gold};--bb-rose:${t.rose};}`}</style>
      </head>
      <body className="antialiased">
        <ToastProvider>
          <CursorDot />
          <SiteNav />
          {children}
          <AppFooter />
          <PublicTabBar />
          <AutoActualizar />
          <EasterEgg />
        </ToastProvider>
      </body>
    </html>
  );
}
