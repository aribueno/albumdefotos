import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { sql } from '@/lib/db';

const MAX_IDS = 500;

export async function DELETE(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }

  const ids = (body as { ids?: unknown })?.ids;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAX_IDS ||
    !ids.every((id) => Number.isInteger(id))
  ) {
    return NextResponse.json({ error: 'Lista de fotos inválida' }, { status: 400 });
  }

  const photos = await sql`SELECT id, blob_url FROM photos WHERE id = ANY(${ids}::int[])`;

  const results = await Promise.allSettled(photos.map((photo) => del(photo.blob_url as string)));
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Falha ao excluir blob da foto ${photos[index].id}:`, result.reason);
    }
  });

  await sql`DELETE FROM photos WHERE id = ANY(${ids}::int[])`;

  return NextResponse.json({ ok: true, deleted: photos.length });
}
