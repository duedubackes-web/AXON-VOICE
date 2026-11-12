import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AXON VOICE — Estúdio de voz com IA",
  description: "Crie narrações com vozes expressivas, sotaques e linguagem regional brasileira."
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
