import Cloudflare from 'cloudflare';
import { padPageNumber } from './utils';

const isDev = process.env.LOCAL_DEV === 'true';

const client = new Cloudflare({
  apiEmail: process.env.CLOUDFLARE_EMAIL,
  apiKey: process.env.CLOUDFLARE_API_KEY,
});

export async function purgeAllComicPagesFromCache({
  comicName,
  numPages,
}: {
  comicName: string;
  numPages: number;
}) {
  const filePaths = [];
  for (let i = 1; i <= numPages; i++) {
    filePaths.push(
      `${process.env.IMAGE_ACCESS_PATH}/${comicName}/${padPageNumber(i)}.webp`
    );
    filePaths.push(
      `${process.env.IMAGE_ACCESS_PATH}/${comicName}/${padPageNumber(i)}.jpg`
    );
  }
  await purgeCache(filePaths);
}

export async function purgeComicPagesFromCache(comicName: string, pageNumbers: number[]) {
  const filePaths = [];
  for (const pageNumber of pageNumbers) {
    filePaths.push(
      `${process.env.IMAGE_ACCESS_PATH}/${comicName}/${padPageNumber(pageNumber)}.webp`
    );
    filePaths.push(
      `${process.env.IMAGE_ACCESS_PATH}/${comicName}/${padPageNumber(pageNumber)}.jpg`
    );
  }
  await purgeCache(filePaths);
}

export async function purgeComicThumbnailFromCache(comicName: string) {
  await purgeCache([
    `${process.env.IMAGE_ACCESS_PATH}/${comicName}/thumbnail.webp`,
    `${process.env.IMAGE_ACCESS_PATH}/${comicName}/thumbnail.jpg`,
  ]);
}

export async function purgeAdFromCache(adId: string) {
  const fileTypes = ['webp', 'jpg', 'webm', 'mp4', 'gif'];
  const multipliers = [2, 3];
  const filePaths = multipliers.flatMap(multiplier =>
    fileTypes.map(
      fileType => `${process.env.IMAGE_ACCESS_PATH}/pi/${adId}-${multiplier}x.${fileType}`
    )
  );
  await purgeCache(filePaths);
}

async function purgeCache(filePaths: string[]) {
  const filePathChunks = chunk(filePaths, 30);

  if (isDev) {
    console.log(
      `Dev mode, not purging cloudflare cache. In prod, would have purged the following:`
    );
    console.log(filePaths);
    return;
  }

  console.log('Purging cloudflare cache: ', filePaths);
  for (const filePathChunk of filePathChunks) {
    const res = await client.cache.purge({
      zone_id: process.env.CLOUDFLARE_CACHE_ZONE_ID as string,
      files: filePathChunk,
    });

    console.log(`Purged ${filePathChunk.length} files, response:`);
    console.log(res);
  }
}

function chunk(array: string[], size: number) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
