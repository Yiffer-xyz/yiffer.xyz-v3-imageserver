import { existsSync, mkdirSync, readdirSync, renameSync, rmdirSync, rmSync } from 'fs';
import { localDataPath } from '../utils';

export async function deleteComicLocally(comicName: string) {
  const comicPath = `${localDataPath}/${comicName}`;
  if (existsSync(comicPath)) {
    rmdirSync(comicPath, { recursive: true });
  }
}

export async function deletePageLocally(comicName: string, pageName: string) {
  const pagePath = `${localDataPath}/${comicName}/${pageName}`;
  console.log('Deleting page', pagePath);
  if (existsSync(pagePath)) {
    rmSync(pagePath);
  } else {
    console.log('...but it does not exist');
  }
}

export async function deleteAdLocally(adId: string) {
  const adPath = `${localDataPath}/pi`;

  console.log('🗑️ Deleting ad files for', adId);
  const files = readdirSync(adPath).filter(file => file.startsWith(adId));

  for (const file of files) {
    console.log('🗑️ Deleting ad file:', `${adPath}/${file}`);
    rmSync(`${adPath}/${file}`);
  }
}

export async function deleteGenericFileLocally(token: string) {
  const genericFilePath = `${localDataPath}/temp/${token}`;
  if (existsSync(genericFilePath)) {
    rmSync(genericFilePath);
  }
}

export async function renameFileLocally(oldPath: string, newPath: string) {
  const oldFilePath = `${localDataPath}/${oldPath}`;
  const newFilePath = `${localDataPath}/${newPath}`;
  if (existsSync(oldFilePath)) {
    if (newPath.startsWith('comics/')) {
      // Make folder if it doesn't exist
      const comicId = newPath.split('/')[1];
      const comicPath = `${localDataPath}/comics/${comicId}`;
      if (!existsSync(comicPath)) {
        console.log('Creating comic folder', comicPath);
        mkdirSync(comicPath);
      }
    }
    renameSync(oldFilePath, newFilePath);
  } else {
    console.log(`Path ${oldFilePath} does not exist`);
  }
}
