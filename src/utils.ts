import { appendFileSync, existsSync, mkdirSync } from 'fs';

// turns 1 into 0001, 2 into 0002, etc.
export function padPageNumber(pageNumber: number) {
  return pageNumber.toString().padStart(4, '0');
}

export function fileTypeToMime(fileType: string): string {
  switch (fileType) {
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    default:
      return 'image/jpeg';
  }
}

const currentdir = process.cwd();
export const localDataPath = `${currentdir}/data`;
export const localErrorLogPath = `${currentdir}/error-logs`;
export const localErrorLogFilePath = `${localErrorLogPath}/error-logs.json`;

if (process.env.LOCAL_DEV === 'true') {
  if (!existsSync(localDataPath)) {
    mkdirSync(localDataPath);
    console.log('Created data directory for local dev.');
  }
}

if (!existsSync(localDataPath)) {
  mkdirSync(localDataPath);
  console.log('Created data directory for local dev.');
}

if (!existsSync(`${localDataPath}/pi`)) {
  mkdirSync(`${localDataPath}/pi`);
  console.log('Created pi directory for local dev.');
}

if (!existsSync(localErrorLogPath)) {
  mkdirSync(localErrorLogPath);
  appendFileSync(`${localErrorLogPath}/error-logs.json`, '[]');
  console.log(`Created error log file at ${localErrorLogPath}/error-logs.json`);
}

export function createLocalComicFolderIfNotExists(comicName: string) {
  if (!existsSync(`${localDataPath}/${comicName}`)) {
    mkdirSync(`${localDataPath}/${comicName}`);
  }
}
