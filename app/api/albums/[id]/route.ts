import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const albumId = Number(id);

  if (!Number.isInteger(albumId)) {
    return NextResponse.json({ error: 'ID de álbum inválido' }, { status: 400 });
  }

  const [album] = await sql`
    SELECT id, name, created_at, description, cover_photo_id, share_token,
           to_char(event_date, 'YYYY-MM-DD') AS event_date
    FROM albums WHERE id = ${albumId}
  `;

  if (!album) {
    return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 });
  }

  const photos = await sql`
    SELECT id, album_id, blob_url, filename, created_at, taken_at, caption
    FROM photos WHERE album_id = ${albumId}
    ORDER BY COALESCE(taken_at, created_at) ASC, id ASC
  `;

  return NextResponse.json({ album, photos });
}

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) && date.getUTCFullYear() >= 1900;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const albumId = Number(id);

  if (!Number.isInteger(albumId)) {
    return NextResponse.json({ error: 'ID de álbum inválido' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
  }

  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
  const invalid = (message: string) => NextResponse.json({ error: message }, { status: 400 });

  let name: string | null = null;
  if (has('name')) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.trim().length > MAX_NAME_LENGTH) {
      return invalid('Nome do álbum inválido');
    }
    name = body.name.trim();
  }

  let description: string | null = null;
  if (has('description')) {
    if (body.description !== null && typeof body.description !== 'string') return invalid('Descrição inválida');
    const text = typeof body.description === 'string' ? body.description.trim() : '';
    if (text.length > MAX_DESCRIPTION_LENGTH) return invalid('Descrição muito longa');
    description = text.length > 0 ? text : null;
  }

  let eventDate: string | null = null;
  if (has('event_date')) {
    if (body.event_date !== null && body.event_date !== '') {
      if (typeof body.event_date !== 'string' || !isValidDateOnly(body.event_date)) return invalid('Data inválida');
      eventDate = body.event_date;
    }
  }

  let coverPhotoId: number | null = null;
  if (has('cover_photo_id')) {
    if (body.cover_photo_id !== null) {
      if (!Number.isInteger(body.cover_photo_id)) return invalid('Foto de capa inválida');
      const [photo] = await sql`
        SELECT id FROM photos WHERE id = ${body.cover_photo_id as number} AND album_id = ${albumId}
      `;
      if (!photo) return invalid('A foto de capa precisa ser deste álbum');
      coverPhotoId = body.cover_photo_id as number;
    }
  }

  if (!has('name') && !has('description') && !has('event_date') && !has('cover_photo_id')) {
    return invalid('Nada para atualizar');
  }

  const [album] = await sql`
    UPDATE albums SET
      name = CASE WHEN ${has('name')}::boolean THEN ${name}::text ELSE name END,
      description = CASE WHEN ${has('description')}::boolean THEN ${description}::text ELSE description END,
      event_date = CASE WHEN ${has('event_date')}::boolean THEN ${eventDate}::date ELSE event_date END,
      cover_photo_id = CASE WHEN ${has('cover_photo_id')}::boolean THEN ${coverPhotoId}::int ELSE cover_photo_id END
    WHERE id = ${albumId}
    RETURNING id, name, created_at, description, cover_photo_id, share_token,
              to_char(event_date, 'YYYY-MM-DD') AS event_date
  `;

  if (!album) {
    return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ album });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const albumId = Number(id);

  if (!Number.isInteger(albumId)) {
    return NextResponse.json({ error: 'ID de álbum inválido' }, { status: 400 });
  }

  const photos = await sql`SELECT blob_url FROM photos WHERE album_id = ${albumId}`;

  await Promise.allSettled(photos.map((photo) => del(photo.blob_url as string)));

  await sql`DELETE FROM albums WHERE id = ${albumId}`;

  return NextResponse.json({ ok: true });
}
