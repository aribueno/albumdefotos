import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const albums = await sql`
    SELECT
      albums.id,
      albums.name,
      albums.created_at,
      albums.description,
      to_char(albums.event_date, 'YYYY-MM-DD') AS event_date,
      COALESCE(
        (SELECT photos.blob_url FROM photos WHERE photos.id = albums.cover_photo_id),
        (
          SELECT photos.blob_url FROM photos
          WHERE photos.album_id = albums.id
          ORDER BY COALESCE(photos.taken_at, photos.created_at) ASC, photos.id ASC
          LIMIT 1
        )
      ) AS cover_url,
      (
        SELECT COUNT(*)::int FROM photos
        WHERE photos.album_id = albums.id
      ) AS photo_count
    FROM albums
    ORDER BY COALESCE(albums.event_date, albums.created_at::date) DESC, albums.id DESC
  `;
  return NextResponse.json({ albums });
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Nome do álbum é obrigatório' }, { status: 400 });
  }

  const [album] = await sql`
    INSERT INTO albums (name) VALUES (${name.trim()})
    RETURNING id, name, created_at
  `;
  return NextResponse.json({ album }, { status: 201 });
}
