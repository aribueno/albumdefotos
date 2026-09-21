import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';
import { parseIsoDate, readTakenAt } from '@/lib/exif';
import { extractImagesFromMsg, isMsgFile } from '@/lib/msg';

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
  const received = formData.getAll('files').filter((f): f is File => f instanceof File);

  if (received.length === 0) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  const uploaded = [];
  const errors: string[] = [];
  const items: { file: File; takenAt: string | null }[] = [];
  const takenAtHint = parseIsoDate(formData.get('takenAt'));

  for (const file of received) {
    if (!isMsgFile(file)) {
      items.push({ file, takenAt: takenAtHint });
      continue;
    }
    try {
      const images = await extractImagesFromMsg(file);
      if (images.length === 0) {
        errors.push(`${file.name}: nenhuma imagem encontrada`);
      }
      items.push(...images.map((image) => ({ file: image, takenAt: null })));
    } catch (error) {
      console.error(`Falha ao ler ${file.name}:`, error);
      errors.push(`${file.name}: não foi possível ler o arquivo .msg`);
    }
  }

  for (const { file, takenAt: hint } of items) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: tipo de arquivo não suportado`);
      continue;
    }
    if (file.size > MAX_SIZE_BYTES) {
      errors.push(`${file.name}: arquivo maior que 10MB`);
      continue;
    }

    try {
      const takenAt = hint ?? (file.type === 'image/jpeg' ? await readTakenAt(await file.arrayBuffer()) : null);

      const blob = await put(`albums/${albumId}/${Date.now()}-${file.name}`, file, {
        access: 'public',
      });

      const [photo] = await sql`
        INSERT INTO photos (album_id, blob_url, filename, taken_at)
        VALUES (${albumId}, ${blob.url}, ${file.name}, ${takenAt})
        RETURNING id, album_id, blob_url, filename, created_at, taken_at, caption
      `;
      uploaded.push(photo);
    } catch (error) {
      console.error(`Falha ao enviar ${file.name}:`, error);
      errors.push(`${file.name}: falha ao enviar`);
    }
  }

  return NextResponse.json({ uploaded, errors }, { status: uploaded.length > 0 ? 201 : 400 });
}
