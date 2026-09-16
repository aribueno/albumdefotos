import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { sql } from '@/lib/db';

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
