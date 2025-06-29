import { writeFile } from 'fs';
import { localDataPath } from '../utils';
import { AdFileForUpload } from '../types';

export async function saveGenericFileLocally(
  fileObjects: { buffer: Buffer; filename: string }[]
): Promise<boolean> {
  const uploadPromises = fileObjects.map(({ buffer, filename }) => {
    const path = `${localDataPath}/temp/${filename}`;
    return new Promise((resolve, reject) => {
      console.log('Saving file locally:', path);
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
