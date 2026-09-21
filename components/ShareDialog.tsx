'use client';

import { useState } from 'react';
import Dialog from '@/components/Dialog';

type ShareDialogProps = {
  albumId: number;
  token: string | null;
  onClose: () => void;
  onChange: (token: string | null) => void;
};

export default function ShareDialog({ albumId, token, onClose, onChange }: ShareDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const link = token ? `${window.location.origin}/s/${token}` : '';

  async function createLink() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/albums/${albumId}/share`, { method: 'POST' });
      if (!response.ok) {
        setError('Não foi possível criar o link. Tente novamente.');
        return;
      }
      const data = await response.json();
      onChange(data.token);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function disableLink() {
    if (!confirm('Desativar o link? Quem já o recebeu deixará de conseguir abrir o álbum.')) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/albums/${albumId}/share`, { method: 'DELETE' });
      if (!response.ok) {
        setError('Não foi possível desativar o link. Tente novamente.');
        return;
      }
      setCopied(false);
      onChange(null);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError('Não foi possível copiar. Selecione o link e copie manualmente.');
    }
  }

  return (
    <Dialog title="Compartilhar álbum" onClose={onClose}>
      <div className="form">
        {token ? (
          <>
            <p className="dialog__hint">
              Quem tiver este link poderá ver e baixar as fotos deste álbum, sem senha. Ninguém consegue alterar nada.
              Desative o link quando não quiser mais compartilhar.
            </p>
            <input
              className="input"
              type="text"
              readOnly
              value={link}
              aria-label="Link do álbum"
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="dialog__actions">
              <button className="btn btn--danger" type="button" disabled={busy} onClick={disableLink}>
                Desativar link
              </button>
              <button className="btn btn--primary" type="button" onClick={copyLink}>
                {copied ? 'Link copiado' : 'Copiar link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="dialog__hint">
              Crie um link para mostrar este álbum a quem não tem a senha. Quem receber poderá ver e baixar as fotos,
              mas não alterar nada. Você pode desativar o link quando quiser.
            </p>
            <div className="dialog__actions">
              <button className="btn" type="button" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="button" disabled={busy} onClick={createLink}>
                {busy ? 'Criando...' : 'Criar link'}
              </button>
            </div>
          </>
        )}
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
