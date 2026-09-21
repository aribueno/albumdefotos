'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

type Album = {
  id: number;
  name: string;
  created_at: string;
  cover_url: string | null;
  photo_count: number;
  event_date: string | null;
};

function formatMonthYear(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function loadAlbums() {
    setLoading(true);
    try {
      const response = await fetch('/api/albums');
      if (!response.ok) throw new Error('load failed');
      const data = await response.json();
      setAlbums(data.albums ?? []);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
      if (albums.length > 0) setError('Não foi possível atualizar a lista. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;

    try {
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
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }
  }

  async function handleDelete(albumId: number) {
    if (!confirm('Excluir este álbum e todas as suas fotos? Essa ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/albums/${albumId}`, { method: 'DELETE' });

      if (!response.ok) {
        setError('Não foi possível excluir o álbum. Tente novamente.');
        return;
      }

      setError(null);
      loadAlbums();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }
  }

  const firstLoad = loading && albums.length === 0;
  const listUnavailable = loadFailed && albums.length === 0;

  return (
    <>
      <Header />
      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Meus álbuns</h1>
            <p className="page-sub">
              {firstLoad || listUnavailable
                ? ' '
                : `${albums.length} ${albums.length === 1 ? 'álbum' : 'álbuns'}`}
            </p>
          </div>
          <form className="new-album" onSubmit={handleCreate}>
            <input
              className="input"
              type="text"
              placeholder="Nome do novo álbum"
              aria-label="Nome do novo álbum"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button className="btn btn--primary" type="submit">
              Novo álbum
            </button>
          </form>
        </div>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        {firstLoad ? (
          <div className="albums" aria-busy="true">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="skeleton skeleton--card" />
            ))}
          </div>
        ) : listUnavailable ? (
          <div className="empty">
            <p className="empty__title">Não foi possível carregar os álbuns</p>
            <p>Verifique sua conexão e tente de novo.</p>
            <button className="btn btn--primary" type="button" onClick={loadAlbums}>
              Tentar novamente
            </button>
          </div>
        ) : albums.length === 0 ? (
          <div className="empty">
            <svg className="empty__icon" width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="9" cy="10.5" r="1.6" fill="currentColor" />
              <path d="M4 17l4.5-4.2 3 2.8 2.5-2.3L20 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="empty__title">Crie seu primeiro álbum</p>
            <p>Digite um nome no campo acima e clique em Novo álbum.</p>
          </div>
        ) : (
          <ul className="albums">
            {albums.map((album) => (
              <li key={album.id} className="album-card">
                <Link href={`/albuns/${album.id}`} className="album-card__link">
                  <div className="stack">
                    <div className="stack__cover">
                      {album.cover_url ? (
                        <Image src={album.cover_url} alt="" fill sizes="(max-width: 600px) 90vw, 240px" />
                      ) : (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
                          <circle cx="9" cy="10.5" r="1.6" fill="currentColor" />
                          <path d="M4 17l4.5-4.2 3 2.8 2.5-2.3L20 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <h2 className="album-card__name">{album.name}</h2>
                </Link>
                <div className="album-card__footer">
                  <span className="album-card__count">
                    {album.event_date ? `${formatMonthYear(album.event_date)} · ` : ''}
                    {album.photo_count} {album.photo_count === 1 ? 'foto' : 'fotos'}
                  </span>
                  <button
                    className="btn btn--quiet"
                    type="button"
                    aria-label={`Excluir álbum ${album.name}`}
                    onClick={() => handleDelete(album.id)}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
