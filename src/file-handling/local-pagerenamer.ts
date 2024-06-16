import { renameSync } from 'fs';
import { localDataPath } from '../utils';

export async function renamePageFileLocally(
  comicName: string,
  oldFileName: string,
  newFileName: string
): Promise<void> {
  const oldFilePath = `${localDataPath}/${comicName}/${oldFileName}`;
  const newFilePath = `${localDataPath}/${comicName}/${newFileName}`;
  renameSync(oldFilePath, newFilePath);
}
