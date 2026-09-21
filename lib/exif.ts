const EXIF_DATE = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
const MIN_YEAR = 1990;

// EXIF stores wall-clock time without a time zone, so it is kept as UTC and shown as UTC.
export function parseExifDate(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const match = EXIF_DATE.exec(raw);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  return toPlausibleIso(new Date(Date.UTC(year, month - 1, day, hour, minute, second)));
}

export function parseIsoDate(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 40) return null;
  return toPlausibleIso(new Date(raw));
}

function toPlausibleIso(date: Date): string | null {
  const time = date.getTime();
  if (Number.isNaN(time)) return null;
  if (date.getUTCFullYear() < MIN_YEAR) return null;
  if (time > Date.now() + 24 * 60 * 60 * 1000) return null;
  return date.toISOString();
}

export async function readTakenAt(input: Blob | ArrayBuffer | Uint8Array): Promise<string | null> {
  try {
    const exifr = (await import('exifr')).default;
    const tags = await exifr.parse(input, { pick: ['DateTimeOriginal', 'CreateDate'], reviveValues: false });
    return parseExifDate(tags?.DateTimeOriginal ?? tags?.CreateDate);
  } catch {
    return null;
  }
}
