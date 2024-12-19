import { Request, Response } from 'express';
import { deletePageFromR2 } from '../file-handling/cloudflare-comic-delete';
import { padPageNumber } from '../utils';
import { renamePageFileInR2 } from '../file-handling/cloudflare-pagerenamer';
import { renamePageFileLocally } from '../file-handling/local-pagerenamer';
import { deletePageLocally } from '../file-handling/local-comic-delete';
import { purgeComicPagesFromCache } from '../cloudflare-utils';

const renamePageFileFunc =
  process.env.LOCAL_DEV === 'true' ? renamePageFileLocally : renamePageFileInR2;
const deletePageFileFunc =
  process.env.LOCAL_DEV === 'true' ? deletePageLocally : deletePageFromR2;

export type UpdatedComicPage = {
  previousPos?: number;
  newPos?: number;
  isDeleted: boolean;
  hasBeenTempRenamed?: boolean;
};

export async function handleRearrange(req: Request, res: Response) {
  try {
    console.log('Handling rearrange');

    const updatedPagesStr = req.body.pagesData;
    const comicName = req.body.comicName as string;
    const updatedPages: UpdatedComicPage[] = JSON.parse(updatedPagesStr);

    await rearrangeComicPages(comicName, updatedPages);

    console.log('Finished renaming pages!');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to rearrange comic.');
  }

  return res.status(200).send('Rearranged comic successfully.');
}

// Loop 1:
// - If new name == previous, skip
// - If delete, delete
// - Otherwise, rename to {prev}-temp

// Loop 2:
// - Rename {prev}-temp to new name
export async function rearrangeComicPages(
  comicName: string,
  updatedPages: UpdatedComicPage[]
) {
  const changedPageNums = new Set<number>();

  // Loop 1
  for (const updatedPage of updatedPages) {
    if (updatedPage.newPos === updatedPage.previousPos) {
      continue;
    }
    if (updatedPage.isDeleted && updatedPage.previousPos) {
      // Delete files
      const pageNumStr = padPageNumber(updatedPage.previousPos);
      await Promise.all([
        deletePageFileFunc(comicName, `${pageNumStr}.jpg`),
        deletePageFileFunc(comicName, `${pageNumStr}.webp`),
      ]);
      changedPageNums.add(updatedPage.previousPos);
      console.log(` Deleted page ${pageNumStr}`);
    } else if (updatedPage.previousPos && updatedPage.newPos) {
      // Rename files to {prev}-temp
      const oldPageNumStr = padPageNumber(updatedPage.previousPos);
      await Promise.all([
        renamePageFileFunc(
          comicName,
          `${oldPageNumStr}.jpg`,
          comicName,
          `${oldPageNumStr}.jpg-temp`
        ),
        renamePageFileFunc(
          comicName,
          `${oldPageNumStr}.webp`,
          comicName,
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
        comicName,
        `${newPageNumStr}.jpg`
      ),
      renamePageFileFunc(
        comicName,
        `${oldPageNumStr}.webp-temp`,
        comicName,
        `${newPageNumStr}.webp`
      ),
    ]);

    changedPageNums.add(updatedPage.previousPos!);
    changedPageNums.add(updatedPage.newPos!);

    console.log(` Renamed ${oldPageNumStr}.xxx-temp to ${newPageNumStr}.xxx`);
  }

  if (changedPageNums.size > 0) {
    purgeComicPagesFromCache(comicName, Array.from(changedPageNums));
  }
}
