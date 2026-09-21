import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Álbum compartilhado',
  robots: { index: false, follow: false },
};

export default function SharedAlbumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
