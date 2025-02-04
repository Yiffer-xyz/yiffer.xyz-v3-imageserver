import { readdirSync, renameSync } from 'fs';
import { localDataPath } from '../utils';

export default async function renamePagesToTempLocally(comicName: string): Promise<void> {
  const existingPaths = readdirSync(`${localDataPath}/${comicName}`);
  const existingPageNames = existingPaths.filter(
    page =>
      (page.endsWith('.jpg') || page.endsWith('webp')) && !page.includes('thumbnail')
  );

  for (const pageName of existingPageNames) {
    renameSync(
      `${localDataPath}/${comicName}/${pageName}`,
      `${localDataPath}/${comicName}/${pageName}-temp`
    );
  }
}
