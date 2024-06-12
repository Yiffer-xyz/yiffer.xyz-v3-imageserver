import { existsSync, rmdirSync } from 'fs';
import { localDataPath } from '../utils';

export async function deleteComicLocally(comicName: string) {
  const comicPath = `${localDataPath}/${comicName}`;
  if (existsSync(comicPath)) {
    rmdirSync(comicPath, { recursive: true });
  }
}
