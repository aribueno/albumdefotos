import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function parseAlbumId(id: string): number | null {
  const albumId = Number(id);
  return Number.isInteger(albumId) ? albumId : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const albumId = parseAlbumId((await params).id);
  if (albumId === null) {
    return NextResponse.json({ error: 'ID de álbum inválido' }, { status: 400 });
  }

  const [album] = await sql`
    UPDATE albums SET share_token = COALESCE(share_token, ${randomBytes(24).toString('base64url')})
    WHERE id = ${albumId}
    RETURNING share_token
  `;

  if (!album) {
    return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ token: album.share_token });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const albumId = parseAlbumId((await params).id);
  if (albumId === null) {
    return NextResponse.json({ error: 'ID de álbum inválido' }, { status: 400 });
  }

  const [album] = await sql`UPDATE albums SET share_token = NULL WHERE id = ${albumId} RETURNING id`;

  if (!album) {
    return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
