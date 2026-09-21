import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Álbum de Fotos',
    short_name: 'Álbum',
    description: 'Álbum de fotos da família',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f6f8',
    theme_color: '#0e7c86',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/icon', sizes: '192x192', type: 'image/png' },
    ],
  };
}
