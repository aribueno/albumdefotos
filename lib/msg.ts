import MsgReader from '@kenjiuno/msgreader';

const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

export function isMsgFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.msg');
}

function imageMimeType(fileName: string, declared?: string): string | null {
  const mime = declared?.toLowerCase();
  if (mime === 'image/jpg') return 'image/jpeg';
  if (mime && mime.startsWith('image/')) return mime;
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXTENSION[extension] ?? null;
}

export async function extractImagesFromMsg(file: File): Promise<File[]> {
  const buffer = await file.arrayBuffer();
  const header = new Uint8Array(buffer, 0, OLE_MAGIC.length);
  if (header.length < OLE_MAGIC.length || !OLE_MAGIC.every((byte, i) => header[i] === byte)) {
    throw new Error('Arquivo .msg inválido');
  }

  const reader = new MsgReader(buffer);
  const { attachments = [] } = reader.getFileData();

  const images: File[] = [];
  for (const attachment of attachments) {
    const name = attachment.fileName ?? attachment.fileNameShort;
    if (!name) continue;
    const type = imageMimeType(name, attachment.attachMimeTag);
    if (!type) continue;
    const { content } = reader.getAttachment(attachment);
    images.push(new File([content as BlobPart], name, { type }));
  }
  return images;
}
