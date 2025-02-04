import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import s3Client from '../s3';
import { renamePageFileInR2 } from './cloudflare-pagerenamer';
import { getPageNumberFromFilename } from '../comic-upload/comic-upload';

export async function renamePagesToTempInR2(
  comicName: string,
  skipProcessingPagesUntilIncl: number
) {
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
    const pageNumStr = object.Key.split('/').pop();
    if (!pageNumStr) {
      console.log('🆎 This should not happen');
      continue;
    }
    const pageNum = getPageNumberFromFilename(pageNumStr);
    if (pageNum <= skipProcessingPagesUntilIncl) {
      console.log('Skipping page', pageNum);
      continue;
    }
    await renamePageFileInR2(comicName, pageNumStr, comicName, pageNumStr + '-temp');
  }
}
