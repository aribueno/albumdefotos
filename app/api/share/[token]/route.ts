import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

// Public, read-only: no session is required, the unguessable token is the credential.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const notFound = () =>
    NextResponse.json({ error: 'Link indisponível' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });

  if (!TOKEN_PATTERN.test(token)) return notFound();

  const [album] = await sql`
    SELECT id, name, description, to_char(event_date, 'YYYY-MM-DD') AS event_date
    FROM albums WHERE share_token = ${token}
  `;
  if (!album) return notFound();

  const photos = await sql`
    SELECT id, blob_url, filename, taken_at, caption
    FROM photos WHERE album_id = ${album.id}
    ORDER BY COALESCE(taken_at, created_at) ASC, id ASC
  `;

  return NextResponse.json(
    { album: { name: album.name, description: album.description, event_date: album.event_date }, photos },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
