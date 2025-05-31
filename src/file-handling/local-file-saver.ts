import { writeFile } from 'fs';
import { PageForUpload, ThumbnailForUpload, AdFileForUpload } from '../types';
import { createLocalComicFolderIfNotExists, localDataPath } from '../utils';

export async function saveGenericFileLocally(
  fileObjects: { buffer: Buffer; fileType: string }[],
  token: string
): Promise<boolean> {
  const uploadPromises = fileObjects.map(({ buffer, fileType }) => {
    const path = `${localDataPath}/temp/${token}.${fileType}`;
    return new Promise((resolve, reject) => {
      writeFile(path, buffer, err => {
        if (err) {
          console.error(`Failed to save file locally: ${path}`);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  });

  await Promise.all(uploadPromises);

  return true;
}

export async function saveThumbnailFilesLocally(
  comicName: string,
  pagesObjects: ThumbnailForUpload[]
): Promise<boolean> {
  createLocalComicFolderIfNotExists(comicName);

  const uploadPromises = pagesObjects.map(
    ({ buffer, multiplier, fileType, filenameBase }) => {
      const path = `${localDataPath}/${comicName}/${filenameBase}-${multiplier}x.${fileType}`;
      return new Promise((resolve, reject) => {
        writeFile(path, buffer, err => {
          if (err) {
            console.error(`Failed to save thumbnail file locally: ${path}`);
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    }
  );

  await Promise.all(uploadPromises);

  return true;
}

export async function savePageFilesLocally(
  comicName: string,
  pagesObjects: PageForUpload[]
): Promise<boolean> {
  createLocalComicFolderIfNotExists(comicName);

  const uploadPromises = pagesObjects.map(({ buffer, fileType, newFileName }) => {
    const path = `${localDataPath}/${comicName}/${newFileName}`;
    return new Promise((resolve, reject) => {
      writeFile(path, buffer, err => {
        if (err) {
          console.error(`Failed to save page file locally: ${path}`);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  });

  await Promise.all(uploadPromises);

  return true;
}

export async function saveAdFilesLocally(
  adId: string,
  adObjects: AdFileForUpload[]
): Promise<boolean> {
  const uploadPromises = adObjects.map(({ buffer, fileType, multiplier }) => {
    const path = `${localDataPath}/pi/${adId}-${multiplier}x.${fileType}`;
    return new Promise((resolve, reject) => {
      writeFile(path, buffer, err => {
        if (err) {
          console.error(`Failed to save ad file locally: ${path}`);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  });

  await Promise.all(uploadPromises);

  return true;
}
