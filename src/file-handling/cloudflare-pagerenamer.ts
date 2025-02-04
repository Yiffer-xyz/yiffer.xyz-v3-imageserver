import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../s3';

export async function renamePageFileInR2(
  oldComicName: string,
  oldFileName: string,
  newComicName: string,
  newFileName: string
): Promise<void> {
  console.log(
    'Renaming page file in R2',
    oldComicName,
    oldFileName,
    newComicName,
    newFileName
  );

  const copyCommand = new CopyObjectCommand({
    Bucket: process.env.COMICS_BUCKET_NAME,
    CopySource: `${process.env.COMICS_BUCKET_NAME}/${oldComicName}/${oldFileName}`,
    Key: `${newComicName}/${newFileName}`,
  });
  await s3Client.send(copyCommand);

  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.COMICS_BUCKET_NAME,
    Key: `${oldComicName}/${oldFileName}`,
  });
  await s3Client.send(deleteCommand);
}
