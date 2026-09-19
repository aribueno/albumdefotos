'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Lightbox from '@/components/Lightbox';
import { shrinkImageIfLarge } from '@/lib/shrink-image';

type Photo = {
  id: number;
  album_id: number;
  blob_url: string;
  filename: string;
  created_at: string;
};

type Album = {
  id: number;
  name: string;
  created_at: string;
};

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const albumId = params.id;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAlbum() {
    setLoading(true);
    try {
      const response = await fetch(`/api/albums/${albumId}`);
      if (response.status === 404) {
        setAlbum(null);
        setLoadFailed(false);
        return;
      }
      if (!response.ok) throw new Error('load failed');
      const data = await response.json();
      setAlbum(data.album ?? null);
      setPhotos(data.photos ?? []);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
      if (album) setError('Não foi possível atualizar o álbum. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlbum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;

    setUploading(true);
    setError(null);

    const errors: string[] = [];
    for (const original of selected) {
      try {
        const file = await shrinkImageIfLarge(original);
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch(`/api/albums/${albumId}/photos`, {
          method: 'POST',
          body: formData,
        });

        if (response.status === 413) {
          errors.push(`${original.name}: arquivo grande demais para enviar`);
          continue;
        }

        const data = await response.json();
        if (data.errors && data.errors.length > 0) {
          errors.push(...data.errors);
        }
      } catch {
        errors.push(`${original.name}: falha ao enviar`);
      }
    }

    if (errors.length > 0) setError(errors.join(' | '));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadAlbum();
  }

  async function handleDeletePhoto(photoId: number) {
    if (!confirm('Excluir esta foto? Essa ação não pode ser desfeita.')) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });

      if (!response.ok) {
        setError('Não foi possível excluir a foto. Tente novamente.');
        return;
      }

      setError(null);
      setLightboxIndex(null);
      loadAlbum();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }
  }

  if (loading && !album) {
    return (
      <>
        <Header />
        <main className="page">
          <div className="tiles" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="skeleton skeleton--tile" />
            ))}
          </div>
        </main>
      </>
    );
  }

  if (!album) {
    return (
      <>
        <Header />
        <main className="page">
          <Link href="/" className="back">
            ← Álbuns
          </Link>
          {loadFailed ? (
            <div className="empty">
              <p className="empty__title">Não foi possível carregar o álbum</p>
              <p>Verifique sua conexão e tente de novo.</p>
              <button className="btn btn--primary" type="button" onClick={loadAlbum}>
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="empty">
              <p className="empty__title">Álbum não encontrado</p>
              <p>Ele pode ter sido excluído. Volte para a lista de álbuns.</p>
            </div>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page">
        <Link href="/" className="back">
          ← Álbuns
        </Link>

        <div className="page-head">
          <div>
            <h1 className="page-title">{album.name}</h1>
            <p className="page-sub">
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            </p>
          </div>
          <label className={`btn btn--primary upload${uploading ? ' is-busy' : ''}`}>
            {uploading ? 'Enviando...' : 'Adicionar fotos'}
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.msg"
              multiple
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        {photos.length === 0 ? (
          <div className="empty">
            <svg className="empty__icon" width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="9" cy="10.5" r="1.6" fill="currentColor" />
              <path d="M4 17l4.5-4.2 3 2.8 2.5-2.3L20 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="empty__title">Este álbum ainda está vazio</p>
            <p>Clique em Adicionar fotos para enviar imagens ou arquivos .msg.</p>
          </div>
        ) : (
          <ul className="tiles">
            {photos.map((photo, index) => (
              <li key={photo.id} className="tile">
                <button
                  className="tile__open"
                  type="button"
                  aria-label={`Abrir ${photo.filename}`}
                  onClick={() => setLightboxIndex(index)}
                >
                  <Image src={photo.blob_url} alt={photo.filename} fill sizes="(max-width: 600px) 50vw, 240px" />
                </button>
                <button
                  className="tile__delete"
                  type="button"
                  aria-label={`Excluir ${photo.filename}`}
                  onClick={() => handleDeletePhoto(photo.id)}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}

        {lightboxIndex !== null && (
          <Lightbox
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onIndexChange={setLightboxIndex}
            onDelete={handleDeletePhoto}
          />
        )}
      </main>
    </>
  );
}
