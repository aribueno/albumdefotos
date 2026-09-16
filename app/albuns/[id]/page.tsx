'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAlbum() {
    setLoading(true);
    try {
      const response = await fetch(`/api/albums/${albumId}`);
      const data = await response.json();
      setAlbum(data.album ?? null);
      setPhotos(data.photos ?? []);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlbum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    try {
      const response = await fetch(`/api/albums/${albumId}/photos`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        setError(data.errors.join(' | '));
      }

      loadAlbum();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      loadAlbum();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }
  }

  if (loading) {
    return <main style={{ padding: 24 }}>Carregando...</main>;
  }

  if (!album) {
    return <main style={{ padding: 24 }}>Álbum não encontrado.</main>;
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <p>
        <a href="/">&larr; Voltar aos álbuns</a>
      </p>
      <h1>{album.name}</h1>

      <div style={{ marginBottom: 24 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleUpload}
          disabled={uploading}
        />
        {uploading && <p>Enviando...</p>}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {photos.length === 0 ? (
        <p>Nenhuma foto ainda. Adicione a primeira acima.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {photos.map((photo) => (
            <div key={photo.id} style={{ position: 'relative' }}>
              <div
                data-photo-id={photo.id}
                style={{ position: 'relative', width: '100%', height: 140, cursor: 'pointer', background: '#f0f0f0' }}
              >
                <Image src={photo.blob_url} alt={photo.filename} fill style={{ objectFit: 'cover' }} />
              </div>
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                style={{ position: 'absolute', top: 4, right: 4 }}
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
