import { Request, Response } from 'express';
import { sendPageFilesToR2 } from '../file-handling/cloudflare-page-saver';
import {
  deleteComicFromR2,
  deletePageFromR2,
} from '../file-handling/cloudflare-comic-delete';
import { savePageFilesLocally } from '../file-handling/local-page-saver';
import { deleteComicLocally } from '../file-handling/local-comic-delete';
import { padPageNumber } from '../utils';
import { renamePageFileInR2 } from '../file-handling/cloudflare-pagerenamer';
import { renamePageFileLocally } from '../file-handling/local-pagerenamer';

const renamePageFileFunc =
  process.env.LOCAL_DEV === 'true' ? renamePageFileLocally : renamePageFileInR2;

type UpdatedComicPage = {
  previousPos?: number;
  newPos?: number;
  isDeleted: boolean;
  hasBeenTempRenamed?: boolean;
};

export async function handleRearrange(req: Request, res: Response) {
  try {
    console.log('Handling rearrange');

    // Loop 1:
    // - If new name == previous, skip
    // - If delete, delete
    // - Otherwise, rename to {prev}-temp

    // Loop 2:
    // - Rename {prev}-temp to new name

    const updatedPagesStr = req.body.pagesData;
    const comicName = req.body.comicName as string;

    const updatedPages: UpdatedComicPage[] = JSON.parse(updatedPagesStr);

    // Loop 1
    for (const updatedPage of updatedPages) {
      if (updatedPage.newPos === updatedPage.previousPos) {
        continue;
      }
      if (updatedPage.isDeleted && updatedPage.previousPos) {
        // Delete files
        const pageNumStr = padPageNumber(updatedPage.previousPos);
        await Promise.all([
          deletePageFromR2(comicName, `${pageNumStr}.jpg`),
          deletePageFromR2(comicName, `${pageNumStr}.webp`),
        ]);
        console.log(` Deleted page ${pageNumStr}`);
      } else if (updatedPage.previousPos && updatedPage.newPos) {
        // Rename files to {prev}-temp
        const oldPageNumStr = padPageNumber(updatedPage.previousPos);
        await Promise.all([
          renamePageFileFunc(
            comicName,
            `${oldPageNumStr}.jpg`,
            `${oldPageNumStr}.jpg-temp`
          ),
          renamePageFileFunc(
            comicName,
            `${oldPageNumStr}.webp`,
            `${oldPageNumStr}.webp-temp`
          ),
        ]);
        updatedPage.hasBeenTempRenamed = true;
        console.log(` Renamed ${oldPageNumStr}.xxx to ${oldPageNumStr}.xxx-temp`);
      }
    }

    // Loop 2
    for (const updatedPage of updatedPages) {
      if (!updatedPage.hasBeenTempRenamed) {
        continue;
      }

      const oldPageNumStr = padPageNumber(updatedPage.previousPos!);
      const newPageNumStr = padPageNumber(updatedPage.newPos!);

      await Promise.all([
        renamePageFileFunc(
          comicName,
          `${oldPageNumStr}.jpg-temp`,
          `${newPageNumStr}.jpg`
        ),
        renamePageFileFunc(
          comicName,
          `${oldPageNumStr}.webp-temp`,
          `${newPageNumStr}.webp`
        ),
      ]);

      console.log(` Renamed ${oldPageNumStr}.xxx-temp to ${newPageNumStr}.xxx`);
    }

    console.log('Finished renaming pages!');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to rearrange comic.');
  }

  return res.status(200).send('Rearranged comic successfully.');
}
