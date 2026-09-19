'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

type Photo = {
  id: number;
  blob_url: string;
  filename: string;
};

type LightboxProps = {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onDelete: (photoId: number) => void;
};

export default function Lightbox({ photos, index, onClose, onIndexChange, onDelete }: LightboxProps) {
  const photo = photos[index];
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  if (!photo) return null;

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

      <div className="lightbox__stage" onClick={(e) => e.stopPropagation()}>
        <Image src={photo.blob_url} alt={photo.filename} fill sizes="92vw" />
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

      <div className="lightbox__bar" onClick={(e) => e.stopPropagation()}>
        <span className="lightbox__name">
          {photo.filename} · {index + 1} / {photos.length}
        </span>
        <button className="lightbox__delete" type="button" onClick={() => onDelete(photo.id)}>
          Excluir foto
        </button>
      </div>
    </div>
  );
}
