import { AdFileForUpload } from '../types';
import { fileTypeToMime } from '../utils';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../s3';

export async function sendAdFilesToR2(
  adId: string,
  adObjects: AdFileForUpload[]
): Promise<boolean> {
  try {
    const uploadPromises = adObjects.map(({ buffer, fileType, multiplier }) => {
      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.COMICS_BUCKET_NAME,
        Key: `pi/${adId}-${multiplier}x.${fileType}`,
        Body: buffer,
        ContentType: fileTypeToMime(fileType),
      });
      return s3Client.send(putObjectCommand);
    });

    const results = await Promise.allSettled(uploadPromises);
    const anyFailed = results.some(result => result.status === 'rejected');
    return !anyFailed;
  } catch (error) {
    console.error('Error uploading ad files to R2:', error);
    return false;
  }
}
