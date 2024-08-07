import { renameSync } from 'fs';
import { createLocalComicFolderIfNotExists, localDataPath } from '../utils';

export async function renamePageFileLocally(
  oldComicName: string,
  oldFileName: string,
  newComicName: string,
  newFileName: string
): Promise<void> {
  createLocalComicFolderIfNotExists(newComicName);
  const oldFilePath = `${localDataPath}/${oldComicName}/${oldFileName}`;
  const newFilePath = `${localDataPath}/${newComicName}/${newFileName}`;
  renameSync(oldFilePath, newFilePath);
}
