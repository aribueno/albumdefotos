'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import EditAlbumDialog from '@/components/EditAlbumDialog';
import Header from '@/components/Header';
import Lightbox from '@/components/Lightbox';
import { downloadPhoto, downloadZip } from '@/lib/download';
import { readTakenAt } from '@/lib/exif';
import { shrinkImageIfLarge } from '@/lib/shrink-image';

type Photo = {
  id: number;
  album_id: number;
  blob_url: string;
  filename: string;
  created_at: string;
  taken_at: string | null;
  caption: string | null;
};

type Album = {
  id: number;
  name: string;
  created_at: string;
  description: string | null;
  event_date: string | null;
  cover_photo_id: number | null;
  share_token: string | null;
};

function formatEventDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function photoTime(photo: Photo): number {
  return new Date(photo.taken_at ?? photo.created_at).getTime();
}

function sortPhotos(list: Photo[]): Photo[] {
  return [...list].sort((a, b) => photoTime(a) - photoTime(b) || a.id - b.id);
}

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const albumId = params.id;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const [editingAlbum, setEditingAlbum] = useState(false);
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

  useEffect(() => {
    if (!album) return;

    let depth = 0;
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false;

    function onDragEnter(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setDragging(true);
    }
    function onDragOver(event: DragEvent) {
      if (hasFiles(event)) event.preventDefault();
    }
    function onDragLeave(event: DragEvent) {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    }
    function onDrop(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      uploadFiles(Array.from(event.dataTransfer?.files ?? []));
    }

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  });

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    await uploadFiles(Array.from(event.target.files ?? []));
  }

  async function uploadFiles(selectedFiles: File[]) {
    if (selectedFiles.length === 0 || uploading) return;

    setUploading(true);
    setError(null);
    setProgress({ done: 0, total: selectedFiles.length });

    const errors: string[] = [];
    for (const [position, original] of selectedFiles.entries()) {
      try {
        const takenAt = original.type === 'image/jpeg' ? await readTakenAt(original) : null;
        const file = await shrinkImageIfLarge(original);
        const formData = new FormData();
        formData.append('files', file);
        if (takenAt) formData.append('takenAt', takenAt);

        const response = await fetch(`/api/albums/${albumId}/photos`, {
          method: 'POST',
          body: formData,
        });

        if (response.status === 413) {
          errors.push(`${original.name}: arquivo grande demais para enviar`);
          continue;
        }

        const data = await response.json();
        if (data.uploaded && data.uploaded.length > 0) {
          setPhotos((current) => sortPhotos([...current, ...data.uploaded]));
        }
        if (data.errors && data.errors.length > 0) {
          errors.push(...data.errors);
        }
      } catch {
        errors.push(`${original.name}: falha ao enviar`);
      } finally {
        setProgress({ done: position + 1, total: selectedFiles.length });
      }
    }

    if (errors.length > 0) setError(errors.join(' | '));
    setUploading(false);
    setProgress(null);
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

  async function handleSaveCaption(photoId: number, caption: string) {
    const response = await fetch(`/api/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption }),
    });
    if (!response.ok) throw new Error('caption failed');
    const data = await response.json();
    setPhotos((current) =>
      current.map((photo) => (photo.id === photoId ? { ...photo, caption: data.photo.caption } : photo))
    );
  }

  async function handleSetCover(photoId: number) {
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_photo_id: photoId }),
      });
      if (!response.ok) {
        setError('Não foi possível definir a capa. Tente novamente.');
        return;
      }
      const data = await response.json();
      setAlbum(data.album);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }
  }

  function toggleSelecting() {
    setSelecting((current) => !current);
    setSelected(new Set());
  }

  function toggleSelected(photoId: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  const allSelected = photos.length > 0 && selected.size === photos.length;

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(photos.map((photo) => photo.id)));
  }

  async function handleDeleteSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Excluir ${ids.length} ${ids.length === 1 ? 'foto' : 'fotos'}? Essa ação não pode ser desfeita.`)) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        setError('Não foi possível excluir as fotos. Tente novamente.');
        return;
      }

      setError(null);
      setPhotos((current) => current.filter((photo) => !selected.has(photo.id)));
      setSelected(new Set());
      setSelecting(false);
      loadAlbum();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(subset: Photo[]) {
    if (zipProgress || subset.length === 0) return;

    setError(null);
    if (subset.length === 1) {
      await downloadPhoto(subset[0]);
      return;
    }

    setZipProgress({ done: 0, total: subset.length });
    try {
      const failed = await downloadZip(subset, album?.name ?? 'album', (done, total) =>
        setZipProgress({ done, total })
      );
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

  const zipLabel = zipProgress ? `Preparando ${zipProgress.done} de ${zipProgress.total}...` : null;

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
      <main className={`page${selecting ? ' page--selecting' : ''}`}>
        <Link href="/" className="back">
          ← Álbuns
        </Link>

        <div className="page-head">
          <div>
            <h1 className="page-title">{album.name}</h1>
            <p className="page-sub">
              {album.event_date ? `${formatEventDate(album.event_date)} · ` : ''}
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            </p>
            {album.description && <p className="page-desc">{album.description}</p>}
          </div>
          <div className="actions">
            <button className="btn" type="button" onClick={() => setEditingAlbum(true)}>
              Editar
            </button>
            {photos.length > 0 && (
              <button className="btn" type="button" onClick={toggleSelecting}>
                {selecting ? 'Cancelar' : 'Selecionar'}
              </button>
            )}
            {photos.length > 0 && !selecting && (
              <button className="btn" type="button" disabled={!!zipProgress} onClick={() => handleDownload(photos)}>
                {zipLabel ?? 'Baixar álbum'}
              </button>
            )}
            <label className={`btn btn--primary upload${uploading ? ' is-busy' : ''}`}>
              {uploading && progress
                ? `Enviando ${Math.min(progress.done + 1, progress.total)} de ${progress.total}...`
                : 'Adicionar fotos'}
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
        </div>

        {progress && (
          <div
            className="progress"
            role="progressbar"
            aria-label="Andamento do envio"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
          >
            <div className="progress__bar" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        )}

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
            <p>Clique em Adicionar fotos ou arraste as fotos do computador para esta página.</p>
          </div>
        ) : (
          <ul className="tiles">
            {photos.map((photo, index) => {
              const isSelected = selected.has(photo.id);
              return (
                <li key={photo.id} className={`tile${isSelected ? ' is-selected' : ''}`}>
                  <button
                    className="tile__open"
                    type="button"
                    aria-label={selecting ? `Selecionar ${photo.filename}` : `Abrir ${photo.filename}`}
                    aria-pressed={selecting ? isSelected : undefined}
                    onClick={() => (selecting ? toggleSelected(photo.id) : setLightboxIndex(index))}
                  >
                    <Image src={photo.blob_url} alt={photo.filename} fill sizes="(max-width: 600px) 50vw, 240px" />
                  </button>
                  {selecting ? (
                    <span className="tile__check" aria-hidden="true">
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  ) : (
                    <>
                      {photo.id === album.cover_photo_id && <span className="tile__badge">Capa</span>}
                      <button
                      className="tile__delete"
                      type="button"
                      aria-label={`Excluir ${photo.filename}`}
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      Excluir
                    </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {selecting && (
          <div className="selection-bar" role="region" aria-label="Fotos selecionadas">
            <span className="selection-bar__count">
              {selected.size} {selected.size === 1 ? 'selecionada' : 'selecionadas'}
            </span>
            <button className="btn btn--quiet" type="button" onClick={toggleSelectAll}>
              {allSelected ? 'Limpar' : 'Selecionar todas'}
            </button>
            <button
              className="btn"
              type="button"
              disabled={selected.size === 0 || !!zipProgress}
              onClick={() => handleDownload(photos.filter((photo) => selected.has(photo.id)))}
            >
              {zipLabel ?? 'Baixar'}
            </button>
            <button
              className="btn btn--danger"
              type="button"
              disabled={selected.size === 0 || deleting}
              onClick={handleDeleteSelected}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        )}

        {dragging && (
          <div className="drop-overlay" aria-hidden="true">
            Solte as fotos para adicionar ao álbum
          </div>
        )}

        {lightboxIndex !== null && (
          <Lightbox
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onIndexChange={setLightboxIndex}
            onDelete={handleDeletePhoto}
            onDownload={(photo) => downloadPhoto(photo)}
            onSaveCaption={handleSaveCaption}
            onSetCover={handleSetCover}
            coverPhotoId={album.cover_photo_id}
          />
        )}

        {editingAlbum && (
          <EditAlbumDialog
            album={album}
            onClose={() => setEditingAlbum(false)}
            onSaved={(saved) => {
              setAlbum((current) => (current ? { ...current, ...saved } : current));
              setEditingAlbum(false);
            }}
          />
        )}
      </main>
    </>
  );
}
