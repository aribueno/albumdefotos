import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { sql } from '@/lib/db';

const MAX_CAPTION_LENGTH = 300;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photoId = Number(id);

  if (!Number.isInteger(photoId)) {
    return NextResponse.json({ error: 'ID de foto inválido' }, { status: 400 });
  }

  let body: { caption?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
  }

  if (body.caption !== null && typeof body.caption !== 'string') {
    return NextResponse.json({ error: 'Legenda inválida' }, { status: 400 });
  }
  const text = typeof body.caption === 'string' ? body.caption.trim() : '';
  if (text.length > MAX_CAPTION_LENGTH) {
    return NextResponse.json({ error: 'Legenda muito longa' }, { status: 400 });
  }

  const [photo] = await sql`
    UPDATE photos SET caption = ${text.length > 0 ? text : null}
    WHERE id = ${photoId}
    RETURNING id, caption
  `;

  if (!photo) {
    return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ photo });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photoId = Number(id);

  if (!Number.isInteger(photoId)) {
    return NextResponse.json({ error: 'ID de foto inválido' }, { status: 400 });
  }

  const [photo] = await sql`SELECT blob_url FROM photos WHERE id = ${photoId}`;

  if (!photo) {
    return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
  }

  try {
    await del(photo.blob_url as string);
  } catch (error) {
    console.error(`Falha ao excluir blob da foto ${photoId}:`, error);
  }
  await sql`DELETE FROM photos WHERE id = ${photoId}`;

  return NextResponse.json({ ok: true });
}
