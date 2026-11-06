// Layout global da aplicação
// Usar https://gtranslate.io/website-translator-widget para ter a aplicação traduzida para qualquer lingua de forma automática

import './globals.css';
import Navbar from '@/components/Navbar';
import Script from 'next/script';

export const metadata = {
  title: 'SprintStudy - Foco sem Distrações',
  description: 'Completar blocos de estudo focado de 45 minutos com apoio comunitário.',
  icons: {
    icon: '/assets/logo.svg',
    shortcut: '/assets/logo.svg',
    apple: '/assets/logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt" className="h-full">
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 antialiased selection:bg-indigo-500 selection:text-white dark:bg-zinc-950 dark:text-zinc-100">
        
        {/* Barra de Navegação Superior */}
        <Navbar />

        {/* Conteúdo Principal das Páginas */}
        <main className="flex-1 pb-16">{children}</main>

        {/* Contentor do Widget GTranslate */}
        <div className="gtranslate_wrapper" />

        {/* Configuração do GTranslate */}
        <Script id="gtranslate-settings" strategy="beforeInteractive">
          {`
            window.gtranslateSettings = {
              "default_language": "pt",
              "native_language_names": true,
              "wrapper_selector": ".gtranslate_wrapper",
              "switcher_horizontal_position":"right"
            };
          `}
        </Script>

        {/* Script do Widget Flutuante do GTranslate */}
        <Script
          src="https://cdn.gtranslate.net/widgets/latest/float.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
