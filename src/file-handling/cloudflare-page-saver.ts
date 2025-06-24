import { PutObjectCommand } from '@aws-sdk/client-s3';
import { fileTypeToMime } from '../utils';
import s3Client from '../s3';
import { R2_TEMP_FOLDER } from '../constants';

export async function sendGenericFileToR2(
  fileObjects: { buffer: Buffer; filename: string }[]
): Promise<boolean> {
  const uploadPromises = fileObjects.map(({ buffer, filename }) => {
    const fileExtension = filename.split('.').pop() ?? 'jpg';
    const contentType = fileTypeToMime(fileExtension);
    console.log('  Sending file to R2:', filename, contentType);

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.COMICS_BUCKET_NAME,
      Key: `${R2_TEMP_FOLDER}/${filename}`,
      Body: buffer,
      ContentType: contentType,
    });

    return s3Client.send(putObjectCommand);
  });

  const results = await Promise.allSettled(uploadPromises);
  const failedSaves = results.filter(result => result.status === 'rejected');

  if (failedSaves.length > 0) {
    console.log('⛔ Failed to save files.');
    for (const failedSave of failedSaves) {
      console.error(failedSave.status, failedSave.reason);
    }
    return false;
  }

  return true;
}
