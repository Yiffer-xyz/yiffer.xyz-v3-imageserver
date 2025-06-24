import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { R2_PROFILE_PHOTOS_FOLDER, R2_TEMP_FOLDER } from './constants';

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

export function getFileExtension(filename: string) {
  return filename.substring(filename.lastIndexOf('.') + 1).replace('jpeg', 'jpg');
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
  if (!existsSync(`${localDataPath}/pi`)) {
    mkdirSync(`${localDataPath}/pi`);
    console.log('Created pi directory for local dev.');
  }
  if (!existsSync(`${localDataPath}/${R2_TEMP_FOLDER}`)) {
    mkdirSync(`${localDataPath}/temp`);
    console.log('Created temp directory for local dev.');
  }
  if (!existsSync(`${localDataPath}/${R2_PROFILE_PHOTOS_FOLDER}`)) {
    mkdirSync(`${localDataPath}/${R2_PROFILE_PHOTOS_FOLDER}`);
    console.log('Created profile photos directory for local dev.');
  }
}

if (!existsSync(localErrorLogPath)) {
  mkdirSync(localErrorLogPath);
  appendFileSync(`${localErrorLogPath}/error-logs.json`, '[]');
  console.log(`Created error log file at ${localErrorLogPath}/error-logs.json`);
}

// TODO:
// TODO: 🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎
// We need this!
export function createLocalComicFolderIfNotExists(comicName: string) {
  if (!existsSync(`${localDataPath}/${comicName}`)) {
    mkdirSync(`${localDataPath}/${comicName}`);
  }
}
