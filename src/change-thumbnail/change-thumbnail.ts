import { Request, Response } from 'express';
import { sendThumbnailFilesToR2 } from '../file-handling/cloudflare-page-saver';
import { saveThumbnailFilesLocally } from '../file-handling/local-page-saver';
import { processThumbnailFile } from '../comic-upload/comic-upload';
import { purgeComicThumbnailFromCache } from '../cloudflare-utils';

const saveThumbnailFilesFunc =
  process.env.LOCAL_DEV === 'true' ? saveThumbnailFilesLocally : sendThumbnailFilesToR2;

export async function handleChangeThumbnail(req: Request, res: Response) {
  console.log('Handling thumbnail change');

  await new Promise((r, rej) => {
    setTimeout(r, 2000);
  });

  if (!req.file) {
    console.log('⛔ No file was uploaded.');
    return res.status(400).send('No file was uploaded.');
  }
  if (!req.body.comicName) {
    console.log('⛔ comicName is required.');
    return res.status(400).send('comicName is required.');
  }

  const comicName = req.body.comicName as string;
  console.log(`Comic name: ${comicName}.`);

  const thumbnailObjects = await processThumbnailFile(req.file);
  console.log('Processed thumbnail.');
  const thumbnailSuccess = await saveThumbnailFilesFunc(comicName, thumbnailObjects);
  if (!thumbnailSuccess) {
    console.log('⛔ Failed to upload thumbnail.');
    return res.status(500).send('Failed to upload thumbnail.');
  }

  purgeComicThumbnailFromCache(comicName);

  console.log('✅ Thumbnail change successful.');
  return res.status(200).send('Upload successful');
}
