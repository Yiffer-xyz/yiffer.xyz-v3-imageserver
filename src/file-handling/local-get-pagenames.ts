import { readdirSync } from 'fs';
import { localDataPath } from '../utils';

export default async function getPageNumsLocally(
  comicName: string
): Promise<{ pageNums: number[]; pageNames: string[] }> {
  const existingPaths = readdirSync(`${localDataPath}/${comicName}`);
  const existingPageNames = existingPaths.filter(
    page =>
      (page.endsWith('.jpg') || page.endsWith('webp')) && !page.includes('thumbnail')
  );
  const existingPageNums = existingPageNames.map(page => parseInt(page.split('.')[0]));

  return { pageNums: existingPageNums, pageNames: existingPageNames };
}
