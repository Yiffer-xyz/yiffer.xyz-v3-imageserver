import { writeFile } from 'fs';
import { AdFileForUpload } from '../types';
import { localDataPath } from '../utils';

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
