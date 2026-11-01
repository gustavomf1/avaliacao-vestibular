import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";
import "./app.css";

const corpo = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--fonte-corpo" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--fonte-mono" });
const titulo = Sora({ subsets: ["latin"], weight: ["600"], variable: "--fonte-titulo" });

export const metadata: Metadata = {
  title: "Avaliação Vestibular",
  description: "Avaliação fisioterapêutica neurofuncional para disfunção vestibular",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafcfc",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${mono.variable} ${titulo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
