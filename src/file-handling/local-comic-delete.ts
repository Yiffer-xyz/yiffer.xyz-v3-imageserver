import { existsSync, rmdirSync, rmSync } from 'fs';
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
