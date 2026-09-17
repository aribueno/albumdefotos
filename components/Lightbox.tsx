'use client';

import { useCallback, useEffect } from 'react';
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

  if (!photo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{ position: 'absolute', top: 16, right: 16, fontSize: 24, color: '#fff', background: 'none', border: 'none' }}
      >
        ✕
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
        style={{ position: 'absolute', left: 16, fontSize: 32, color: '#fff', background: 'none', border: 'none' }}
      >
        ‹
      </button>

      <div style={{ position: 'relative', width: '80vw', height: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <Image src={photo.blob_url} alt={photo.filename} fill style={{ objectFit: 'contain' }} />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
        style={{ position: 'absolute', right: 16, fontSize: 32, color: '#fff', background: 'none', border: 'none' }}
      >
        ›
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(photo.id);
        }}
        style={{ position: 'absolute', bottom: 16, color: '#fff', background: 'none', border: '1px solid #fff', padding: '8px 16px' }}
      >
        Excluir foto
      </button>
    </div>
  );
}
