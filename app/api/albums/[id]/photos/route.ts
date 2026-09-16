import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const albumId = Number(id);

  if (!Number.isInteger(albumId)) {
    return NextResponse.json({ error: 'ID de álbum inválido' }, { status: 400 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files').filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  const uploaded = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: tipo de arquivo não suportado`);
      continue;
    }
    if (file.size > MAX_SIZE_BYTES) {
      errors.push(`${file.name}: arquivo maior que 10MB`);
      continue;
    }

    const blob = await put(`albums/${albumId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    const [photo] = await sql`
      INSERT INTO photos (album_id, blob_url, filename)
      VALUES (${albumId}, ${blob.url}, ${file.name})
      RETURNING id, album_id, blob_url, filename, created_at
    `;
    uploaded.push(photo);
  }

  return NextResponse.json({ uploaded, errors }, { status: uploaded.length > 0 ? 201 : 400 });
}
