import { PutObjectCommand } from '@aws-sdk/client-s3';
import { PageForUpload, ThumbnailForUpload } from '../types';
import { fileTypeToMime } from '../utils';
import s3Client from '../s3';
import { R2_TEMP_PICTURES_FOLDER } from '../constants';

export async function sendGenericFileToR2(
  fileObjects: { buffer: Buffer; fileType: string }[],
  token: string
): Promise<boolean> {
  const uploadPromises = fileObjects.map(({ buffer, fileType }) => {
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.COMICS_BUCKET_NAME,
      Key: `${R2_TEMP_PICTURES_FOLDER}/${token}.${fileType}`,
      Body: buffer,
      ContentType: fileTypeToMime(fileType),
    });
    return s3Client.send(putObjectCommand);
  });

  const results = await Promise.allSettled(uploadPromises);
  const anyFailed = results.some(result => result.status === 'rejected');

  return !anyFailed;
}

export async function sendThumbnailFilesToR2(
  comicName: string,
  pagesObjects: ThumbnailForUpload[]
): Promise<boolean> {
  const uploadPromises = pagesObjects.map(
    ({ buffer, multiplier, fileType, filenameBase }) => {
      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.COMICS_BUCKET_NAME,
        Key: `${comicName}/${filenameBase}-${multiplier}x.${fileType}`,
        Body: buffer,
        ContentType: fileTypeToMime(fileType),
      });
      return s3Client.send(putObjectCommand);
    }
  );

  const results = await Promise.allSettled(uploadPromises);
  const anyFailed = results.some(result => result.status === 'rejected');

  return !anyFailed;
}

export async function sendPageFilesToR2(
  comicName: string,
  pagesObjects: PageForUpload[]
): Promise<boolean> {
  const uploadPromises = pagesObjects.map(({ buffer, fileType, newFileName }) => {
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.COMICS_BUCKET_NAME,
      Key: `${comicName}/${newFileName}`,
      Body: buffer,
      ContentType: fileTypeToMime(fileType),
    });
    return s3Client.send(putObjectCommand);
  });

  const results = await Promise.allSettled(uploadPromises);
  const anyFailed = results.some(result => result.status === 'rejected');

  return !anyFailed;
}
