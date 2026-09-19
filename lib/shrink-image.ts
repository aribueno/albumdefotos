const SHRINK_ABOVE_BYTES = 3 * 1024 * 1024;
const TARGET_BYTES = 4 * 1024 * 1024;
const MAX_SIDE_PX = 2560;
const QUALITIES = [0.85, 0.7, 0.55];

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function shrinkImageIfLarge(file: File): Promise<File> {
  if (file.size <= SHRINK_ABOVE_BYTES) return file;
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext('2d');
    if (!context) return file;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    let smallest: Blob | null = null;
    for (const quality of QUALITIES) {
      const blob = await toBlob(canvas, quality);
      if (!blob) continue;
      smallest = blob;
      if (blob.size <= TARGET_BYTES) break;
    }

    if (!smallest || smallest.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([smallest], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
