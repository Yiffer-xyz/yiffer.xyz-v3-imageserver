import { Request, Response } from 'express';
import { renamePageFileInR2 } from '../file-handling/cloudflare-pagerenamer';
import { renamePageFileLocally } from '../file-handling/local-pagerenamer';
import { padPageNumber } from '../utils';
import { MULTIPLIERS_TO_MAKE_THUMBNAILS } from '../constants';
import { deleteComicLocally } from '../file-handling/local-comic-delete';

const renamePageFileFunc =
  process.env.LOCAL_DEV === 'true' ? renamePageFileLocally : renamePageFileInR2;

export default async function handleRename(req: Request, res: Response) {
  try {
    const prevName = req.body.prevComicName as string;
    const newName = req.body.newComicName as string;
    const numPages = req.body.numPages as number;

    console.log(`Handling comic rename from ${prevName} to ${newName}`);

    const renamePromises: Promise<void>[] = [];

    for (let i = 1; i <= numPages; i++) {
      const pageNumStr = padPageNumber(i);
      renamePromises.push(
        renamePageFileFunc(prevName, `${pageNumStr}.jpg`, newName, `${pageNumStr}.jpg`),
        renamePageFileFunc(prevName, `${pageNumStr}.webp`, newName, `${pageNumStr}.webp`)
      );
    }

    ['jpg', 'webp'].forEach(async fileType => {
      MULTIPLIERS_TO_MAKE_THUMBNAILS.forEach(async multiplier => {
        renamePromises.push(
          renamePageFileFunc(
            prevName,
            `thumbnail-${multiplier}x.${fileType}`,
            newName,
            `thumbnail-${multiplier}x.${fileType}`
          )
        );
      });
    });

    console.log(' Renaming files...');
    await Promise.all(renamePromises);

    process.env.LOCAL_DEV === 'true' && (await deleteComicLocally(prevName));

    console.log('Finished renaming comic!');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to rearrange comic.');
  }

  return res.status(200).send('Rearranged comic successfully.');
}
