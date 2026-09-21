'use client';

import { useState } from 'react';
import Dialog from '@/components/Dialog';

export type EditableAlbum = {
  id: number;
  name: string;
  description: string | null;
  event_date: string | null;
};

type EditAlbumDialogProps = {
  album: EditableAlbum;
  onClose: () => void;
  onSaved: (album: EditableAlbum) => void;
};

export default function EditAlbumDialog({ album, onClose, onSaved }: EditAlbumDialogProps) {
  const [name, setName] = useState(album.name);
  const [description, setDescription] = useState(album.description ?? '');
  const [eventDate, setEventDate] = useState(album.event_date ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Dê um nome ao álbum.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/albums/${album.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, event_date: eventDate || null }),
      });
      if (!response.ok) {
        setError('Não foi possível salvar. Confira os dados e tente de novo.');
        return;
      }
      const data = await response.json();
      onSaved(data.album);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog title="Editar álbum" onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Nome</span>
          <input className="input" type="text" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Data do álbum (opcional)</span>
          <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Descrição (opcional)</span>
          <textarea
            className="input input--area"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <div className="dialog__actions">
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
