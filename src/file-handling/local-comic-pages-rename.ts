import { readdirSync, renameSync } from 'fs';
import { localDataPath } from '../utils';
import { getPageNumberFromFilename } from '../comic-upload/comic-upload';

export default async function renamePagesToTempLocally(
  comicName: string,
  skipProcessingPagesUntilIncl: number
): Promise<void> {
  const existingPaths = readdirSync(`${localDataPath}/${comicName}`);
  const existingPageNames = existingPaths.filter(
    page =>
      (page.endsWith('.jpg') || page.endsWith('webp')) && !page.includes('thumbnail')
  );

  for (const pageName of existingPageNames) {
    const pageNum = getPageNumberFromFilename(pageName);
    if (pageNum <= skipProcessingPagesUntilIncl) {
      console.log('Skipping page', pageNum);
      continue;
    }
    renameSync(
      `${localDataPath}/${comicName}/${pageName}`,
      `${localDataPath}/${comicName}/${pageName}-temp`
    );
  }
}
