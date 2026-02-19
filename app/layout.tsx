import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TikTok Up Market',
  description: 'Minere produtos virais do TikTok, analise com IA e envie alertas direto para o Telegram.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${spaceGrotesk.variable} bg-slate-950 text-slate-50 antialiased`}>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_25%),radial-gradient(circle_at_80%_0,rgba(34,211,238,0.1),transparent_25%)]" />
          <main className="relative mx-auto max-w-6xl px-6 py-10 lg:px-12 lg:py-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
