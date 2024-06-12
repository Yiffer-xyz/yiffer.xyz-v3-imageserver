import { existsSync, mkdirSync } from 'fs';

// turns 1 into 0001, 2 into 0002, etc.
export function padPageNumber(pageNumber: number) {
  return pageNumber.toString().padStart(4, '0');
}

export function fileTypeToMime(fileType: string): string {
  if (fileType === 'webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
}

const currentdir = process.cwd();
export const localDataPath = `${currentdir}/data`;

if (process.env.LOCAL_DEV === 'true') {
  if (!existsSync(localDataPath)) {
    mkdirSync(localDataPath);
    console.log('Created data directory for local dev.');
  }
}
