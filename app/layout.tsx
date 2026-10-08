import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import TourGuiado from "@/components/TourGuiado";
import PageTransition from "@/components/PageTransition";
import CompareToast from "@/components/CompareToast";
import UndoToast from "@/components/UndoToast";
import Sincronizador from "@/components/Sincronizador";
import InstalarApp from "@/components/InstalarApp";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Leroy Merlin — Encontre na loja",
  description:
    "Busque produtos, tire dúvidas e agende visitas nas lojas Leroy Merlin",
  // Nome e comportamento quando o site é instalado como aplicativo (ver app/manifest.ts).
  // O ícone vem de app/icon.png e app/apple-icon.png, que o Next liga sozinho.
  applicationName: "Leroy Merlin",
  appleWebApp: { capable: true, title: "Leroy Merlin", statusBarStyle: "default" },
  // Sem isto o iPhone transforma qualquer sequência de números (código de produto, número
  // de pedido) em link de telefone.
  formatDetection: { telephone: false },
};

// Cor da barra do navegador no celular (e da barra de status do aplicativo instalado): o
// verde do cabeçalho, que é o mesmo no modo claro e no escuro.
export const viewport: Viewport = {
  themeColor: "#00843d",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('lm-theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${inter.className} bg-white min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <NavBar />
        <TourGuiado />
        {/* flex-1 empurra o Footer pro fim real da viewport mesmo em páginas com pouco
            conteúdo (ex: Comparador/Régua virtual vazios) — sem isso o rodapé ficaria colado
            logo abaixo do conteúdo curto, sobrando vazio depois dele em vez de antes. */}
        <div className="flex-1 flex flex-col">
          <PageTransition>{children}</PageTransition>
        </div>
        <Footer />
        <CompareToast />
        <UndoToast />
        {/* Espelha pedidos e atendimento no Supabase (lib/sync). Não desenha nada. */}
        <Sincronizador />
        {/* Deixa o site ser instalado como aplicativo (lib/instalacaoApp.ts). Não desenha nada. */}
        <InstalarApp />
      </body>
    </html>
  );
}
