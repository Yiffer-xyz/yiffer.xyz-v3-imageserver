import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import s3Client from '../s3';
import { renamePageFileInR2 } from './cloudflare-pagerenamer';

export async function renamePagesToTempInR2(comicName: string) {
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.COMICS_BUCKET_NAME,
    Prefix: `${comicName}/`,
  });
  const listResponse = await s3Client.send(listCommand);
  if (!listResponse.Contents) return;

  const objects = listResponse.Contents.map(({ Key }) => ({ Key }));

  for (const object of objects) {
    if (!object.Key) {
      console.log('🆎 This should not happen');
      continue;
    }
    if (object.Key.includes('thumbnail')) {
      continue;
    }
    await renamePageFileInR2(comicName, object.Key, comicName, object.Key + '-temp');
  }
}
