import { Zip, ZipPassThrough } from 'fflate';

export type DownloadablePhoto = { blob_url: string; filename: string };

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function downloadPhoto(photo: DownloadablePhoto): Promise<void> {
  try {
    const response = await fetch(photo.blob_url);
    if (!response.ok) throw new Error('download failed');
    saveBlob(await response.blob(), photo.filename);
  } catch {
    window.location.href = `${photo.blob_url}?download=1`;
  }
}

function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : '';
  let counter = 2;
  while (used.has(`${base} (${counter})${extension}`)) counter += 1;
  const unique = `${base} (${counter})${extension}`;
  used.add(unique);
  return unique;
}

export async function buildZip(
  photos: DownloadablePhoto[],
  onProgress?: (done: number, total: number) => void
): Promise<{ blob: Blob; failed: number }> {
  const chunks: Uint8Array[] = [];
  let zipError: Error | null = null;
  const zip = new Zip((error, chunk) => {
    if (error) zipError = error;
    else chunks.push(chunk);
  });

  const usedNames = new Set<string>();
  let failed = 0;

  for (const [position, photo] of photos.entries()) {
    try {
      const response = await fetch(photo.blob_url);
      if (!response.ok) throw new Error('download failed');
      const data = new Uint8Array(await response.arrayBuffer());
      const entry = new ZipPassThrough(uniqueName(photo.filename, usedNames));
      zip.add(entry);
      entry.push(data, true);
    } catch {
      failed += 1;
    }
    onProgress?.(position + 1, photos.length);
  }

  zip.end();
  if (zipError) throw zipError;

  return { blob: new Blob(chunks as BlobPart[], { type: 'application/zip' }), failed };
}

export async function downloadZip(
  photos: DownloadablePhoto[],
  zipName: string,
  onProgress?: (done: number, total: number) => void
): Promise<number> {
  const { blob, failed } = await buildZip(photos, onProgress);
  const safeName = zipName.replace(/[\\/:*?"<>|]+/g, '').trim() || 'album';
  saveBlob(blob, `${safeName}.zip`);
  return failed;
}
