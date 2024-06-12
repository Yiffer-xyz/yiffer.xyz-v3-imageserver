import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import s3Client from '../s3';

export async function deleteComicFromR2(comicName: string) {
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.COMICS_BUCKET_NAME,
    Prefix: `${comicName}/`,
  });
  const listResponse = await s3Client.send(listCommand);
  if (!listResponse.Contents) return;

  const objects = listResponse.Contents.map(({ Key }) => ({ Key }));
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: process.env.COMICS_BUCKET_NAME,
    Delete: {
      Objects: objects,
    },
  });
  await s3Client.send(deleteCommand);
}
