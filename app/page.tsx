'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Album = {
  id: number;
  name: string;
  created_at: string;
  cover_url: string | null;
};

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function loadAlbums() {
    setLoading(true);
    const response = await fetch('/api/albums');
    const data = await response.json();
    setAlbums(data.albums ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;

    const response = await fetch('/api/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (!response.ok) {
      setError('Não foi possível criar o álbum. Tente novamente.');
      return;
    }

    setNewName('');
    setError(null);
    loadAlbums();
  }

  async function handleDelete(albumId: number) {
    if (!confirm('Excluir este álbum e todas as suas fotos? Essa ação não pode ser desfeita.')) {
      return;
    }

    const response = await fetch(`/api/albums/${albumId}`, { method: 'DELETE' });

    if (!response.ok) {
      setError('Não foi possível excluir o álbum. Tente novamente.');
      return;
    }

    loadAlbums();
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1>Meus Álbuns</h1>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Nome do novo álbum"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Novo álbum</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : albums.length === 0 ? (
        <p>Nenhum álbum ainda. Crie o primeiro acima.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {albums.map((album) => (
            <div key={album.id} style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
              <Link href={`/albuns/${album.id}`}>
                <div style={{ position: 'relative', width: '100%', height: 160, background: '#f0f0f0' }}>
                  {album.cover_url && (
                    <Image src={album.cover_url} alt={album.name} fill style={{ objectFit: 'cover' }} />
                  )}
                </div>
                <p style={{ padding: 8, margin: 0 }}>{album.name}</p>
              </Link>
              <button onClick={() => handleDelete(album.id)} style={{ margin: 8 }}>
                Excluir álbum
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
