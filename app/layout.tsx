import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Álbum de Fotos',
  description: 'Álbum de fotos da família',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
