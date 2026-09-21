'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Lightbox from '@/components/Lightbox';
import { downloadPhoto, downloadZip } from '@/lib/download';
import { formatEventDate } from '@/lib/format';

type SharedPhoto = {
  id: number;
  blob_url: string;
  filename: string;
  taken_at: string | null;
  caption: string | null;
};

type SharedAlbum = {
  name: string;
  description: string | null;
  event_date: string | null;
};

type Status = 'loading' | 'ready' | 'missing' | 'failed';

export default function SharedAlbumPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [status, setStatus] = useState<Status>('loading');
  const [album, setAlbum] = useState<SharedAlbum | null>(null);
  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setStatus('loading');
    try {
      const response = await fetch(`/api/share/${token}`);
      if (response.status === 404) {
        setStatus('missing');
        return;
      }
      if (!response.ok) throw new Error('load failed');
      const data = await response.json();
      setAlbum(data.album);
      setPhotos(data.photos ?? []);
      setStatus('ready');
    } catch {
      setStatus('failed');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleDownloadAlbum() {
    if (zipProgress || photos.length === 0 || !album) return;
    setError(null);
    setZipProgress({ done: 0, total: photos.length });
    try {
      const failed = await downloadZip(photos, album.name, (done, total) => setZipProgress({ done, total }));
      if (failed > 0) {
        setError(
          failed === 1
            ? '1 foto não pôde ser incluída no arquivo.'
            : `${failed} fotos não puderam ser incluídas no arquivo.`
        );
      }
    } catch {
      setError('Não foi possível criar o arquivo .zip. Tente novamente.');
    } finally {
      setZipProgress(null);
    }
  }

  if (status === 'loading') {
    return (
      <>
        <Header showLogout={false} homeHref={null} />
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

  if (status !== 'ready' || !album) {
    return (
      <>
        <Header showLogout={false} homeHref={null} />
        <main className="page">
          {status === 'failed' ? (
            <div className="empty">
              <p className="empty__title">Não foi possível carregar o álbum</p>
              <p>Verifique sua conexão e tente de novo.</p>
              <button className="btn btn--primary" type="button" onClick={load}>
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="empty">
              <p className="empty__title">Link indisponível</p>
              <p>Este link foi desativado ou não existe. Peça um novo link a quem compartilhou o álbum.</p>
            </div>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <Header showLogout={false} homeHref={null} />
      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">{album.name}</h1>
            <p className="page-sub">
              {album.event_date ? `${formatEventDate(album.event_date)} · ` : ''}
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            </p>
            {album.description && <p className="page-desc">{album.description}</p>}
          </div>
          {photos.length > 0 && (
            <div className="actions">
              <button className="btn btn--primary" type="button" disabled={!!zipProgress} onClick={handleDownloadAlbum}>
                {zipProgress ? `Preparando ${zipProgress.done} de ${zipProgress.total}...` : 'Baixar álbum'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        {photos.length === 0 ? (
          <div className="empty">
            <p className="empty__title">Este álbum ainda está vazio</p>
            <p>Volte mais tarde para ver as fotos.</p>
          </div>
        ) : (
          <ul className="tiles">
            {photos.map((photo, index) => (
              <li key={photo.id} className="tile">
                <button
                  className="tile__open"
                  type="button"
                  aria-label={`Abrir ${photo.caption || photo.filename}`}
                  onClick={() => setLightboxIndex(index)}
                >
                  <Image
                    src={photo.blob_url}
                    alt={photo.caption || photo.filename}
                    fill
                    sizes="(max-width: 600px) 50vw, 240px"
                  />
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
            onDownload={(photo) => downloadPhoto(photo)}
          />
        )}
      </main>
    </>
  );
}
