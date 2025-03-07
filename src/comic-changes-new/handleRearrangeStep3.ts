import { Request, Response } from 'express';
import { padPageNumber } from '../utils';
import { renamePageFileLocally } from '../file-handling/local-pagerenamer';
import { renamePageFileInR2 } from '../file-handling/cloudflare-pagerenamer';
import { purgeComicPagesFromCache } from '../cloudflare-utils';

const renamePageFunc =
  process.env.LOCAL_DEV === 'true' ? renamePageFileLocally : renamePageFileInR2;

export async function handleRearrangeStep3(req: Request, res: Response) {
  try {
    console.log('rearrange-step3');

    if (!req.body.comicName || !req.body.pageChanges) {
      console.log('⛔ Comic name and page changes are required.');
      return res.status(400).send('Comic name and page changes are required.');
    }

    const comicName = req.body.comicName as string;
    const pageChanges: {
      originalPos: number;
      newPos: number;
      isUnchanged: boolean;
    }[] = req.body.pageChanges;

    let skipProcessingPagesUntilIncl = req.body.skipProcessingPagesUntilIncl;
    if (!skipProcessingPagesUntilIncl || Number.isNaN(skipProcessingPagesUntilIncl)) {
      skipProcessingPagesUntilIncl = 0;
    } else {
      skipProcessingPagesUntilIncl = parseInt(skipProcessingPagesUntilIncl);
    }

    const pageNumsToPurge = new Set<number>();

    const promises: Promise<void>[] = [];
    for (const change of pageChanges) {
      if (change.originalPos <= skipProcessingPagesUntilIncl) {
        console.log('Skipping page', change.originalPos);
        continue;
      }

      const tempFilenameJpg = `${padPageNumber(change.originalPos)}.jpg-temp`;
      const tempFilenameWebp = `${padPageNumber(change.originalPos)}.webp-temp`;
      const newFilenameJpg = `${padPageNumber(change.newPos)}.jpg`;
      const newFilenameWebp = `${padPageNumber(change.newPos)}.webp`;

      if (!change.isUnchanged) {
        pageNumsToPurge.add(change.originalPos);
        pageNumsToPurge.add(change.newPos);
      }

      promises.push(
        renamePageFunc(comicName, tempFilenameJpg, comicName, newFilenameJpg),
        renamePageFunc(comicName, tempFilenameWebp, comicName, newFilenameWebp)
      );
    }

    await Promise.all(promises);

    if (pageNumsToPurge.size > 0) {
      purgeComicPagesFromCache(comicName, Array.from(pageNumsToPurge));
    }

    console.log('Finished processing rearrange');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to rearrange comic step 3.');
  }

  return res.status(200).send('Rearranged comic step 3 successfully.');
}
