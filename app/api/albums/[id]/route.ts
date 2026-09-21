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

  const [album] = await sql`SELECT id, name, created_at FROM albums WHERE id = ${albumId}`;

  if (!album) {
    return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 });
  }

  const photos = await sql`
    SELECT id, album_id, blob_url, filename, created_at, taken_at
    FROM photos WHERE album_id = ${albumId}
    ORDER BY COALESCE(taken_at, created_at) ASC, id ASC
  `;

  return NextResponse.json({ album, photos });
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
