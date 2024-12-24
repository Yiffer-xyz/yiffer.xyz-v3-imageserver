import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import s3Client from '../s3';

export default async function getPageNamesCloudflare(
  comicName: string
): Promise<{ pageNums: number[]; pageNames: string[] }> {
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.COMICS_BUCKET_NAME,
    Prefix: `${comicName}/`,
  });
  const listResponse = await s3Client.send(listCommand);
  if (!listResponse.Contents) return { pageNums: [], pageNames: [] };

  const existingPages = listResponse.Contents.map(content =>
    content.Key?.substring(comicName.length + 1)
  ).filter(
    page =>
      !!page &&
      (page.endsWith('.jpg') || page.endsWith('webp')) &&
      !page.includes('thumbnail')
  ) as string[];

  const existingPageNums = existingPages.map(page => parseInt(page!.split('.')[0]));

  return { pageNums: existingPageNums, pageNames: existingPages };
}
