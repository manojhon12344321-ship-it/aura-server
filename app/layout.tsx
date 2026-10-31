import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: {
    default: "DIVINOS GAMES | Seu próximo nível começa aqui",
    template: "%s | DIVINOS GAMES",
  },
  description:
    "Consoles, jogos e acessórios originais. Eleve seu jogo com DIVINOS GAMES.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
