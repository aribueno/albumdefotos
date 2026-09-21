'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type Photo = {
  id: number;
  blob_url: string;
  filename: string;
  taken_at?: string | null;
  caption?: string | null;
};

type LightboxProps = {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onDownload: (photo: Photo) => void;
  onDelete?: (photoId: number) => void;
  onSaveCaption?: (photoId: number, caption: string) => Promise<void>;
  onSetCover?: (photoId: number) => void;
  coverPhotoId?: number | null;
};

const SWIPE_DISTANCE_PX = 50;

function formatTakenAt(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function Lightbox({
  photos,
  index,
  onClose,
  onIndexChange,
  onDownload,
  onDelete,
  onSaveCaption,
  onSetCover,
  coverPhotoId,
}: LightboxProps) {
  const photo = photos[index];
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [draft, setDraft] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % photos.length);
  }, [index, photos.length, onIndexChange]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    setEditingCaption(false);
    setCaptionError(null);
  }, [photo?.id]);

  useEffect(() => {
    if (editingCaption) captionInputRef.current?.focus();
  }, [editingCaption]);

  if (!photo) return null;

  function handleTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.changedTouches.length === 0) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  function startEditingCaption() {
    setDraft(photo.caption ?? '');
    setCaptionError(null);
    setEditingCaption(true);
  }

  async function submitCaption(event: React.FormEvent) {
    event.preventDefault();
    if (!onSaveCaption) return;
    setSavingCaption(true);
    setCaptionError(null);
    try {
      await onSaveCaption(photo.id, draft);
      setEditingCaption(false);
    } catch {
      setCaptionError('Não foi possível salvar a legenda.');
    } finally {
      setSavingCaption(false);
    }
  }

  const isCover = coverPhotoId === photo.id;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${index + 1} de ${photos.length}`}
      onClick={onClose}
    >
      <button
        ref={closeButtonRef}
        className="lightbox__btn lightbox__btn--close"
        type="button"
        aria-label="Fechar"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <button
        className="lightbox__btn lightbox__btn--prev"
        type="button"
        aria-label="Foto anterior"
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        className="lightbox__stage"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image src={photo.blob_url} alt={photo.caption || photo.filename} fill sizes="92vw" />
      </div>

      <button
        className="lightbox__btn lightbox__btn--next"
        type="button"
        aria-label="Próxima foto"
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {(photo.caption || onSaveCaption) && (
        <div className="lightbox__caption" onClick={(e) => e.stopPropagation()}>
          {editingCaption ? (
            <form className="lightbox__caption-form" onSubmit={submitCaption}>
              <input
                ref={captionInputRef}
                className="lightbox__caption-input"
                type="text"
                maxLength={300}
                placeholder="Escreva uma legenda"
                aria-label="Legenda da foto"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Escape') setEditingCaption(false);
                }}
              />
              <button className="lightbox__action" type="submit" disabled={savingCaption}>
                {savingCaption ? 'Salvando...' : 'Salvar'}
              </button>
              <button className="lightbox__action" type="button" onClick={() => setEditingCaption(false)}>
                Cancelar
              </button>
            </form>
          ) : (
            <>
              {photo.caption && <span className="lightbox__caption-text">{photo.caption}</span>}
              {onSaveCaption && (
                <button className="lightbox__link" type="button" onClick={startEditingCaption}>
                  {photo.caption ? 'Editar legenda' : 'Adicionar legenda'}
                </button>
              )}
            </>
          )}
          {captionError && <span className="lightbox__caption-error">{captionError}</span>}
        </div>
      )}

      <div className="lightbox__bar" onClick={(e) => e.stopPropagation()}>
        <span className="lightbox__name">
          {photo.filename} · {index + 1} / {photos.length}
          {photo.taken_at ? ` · ${formatTakenAt(photo.taken_at)}` : ''}
        </span>
        <div className="lightbox__actions">
          {onSetCover && (
            <button className="lightbox__action" type="button" disabled={isCover} onClick={() => onSetCover(photo.id)}>
              {isCover ? 'Capa do álbum' : 'Definir como capa'}
            </button>
          )}
          <button className="lightbox__action" type="button" onClick={() => onDownload(photo)}>
            Baixar
          </button>
          {onDelete && (
            <button className="lightbox__action lightbox__action--danger" type="button" onClick={() => onDelete(photo.id)}>
              Excluir foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
