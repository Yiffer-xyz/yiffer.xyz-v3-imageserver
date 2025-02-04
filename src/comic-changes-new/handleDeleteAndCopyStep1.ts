import { Request, Response } from 'express';
import { deletePageFromR2 } from '../file-handling/cloudflare-comic-delete';
import { deletePageLocally } from '../file-handling/local-comic-delete';
import { padPageNumber } from '../utils';
import { renamePagesToTempInR2 } from '../file-handling/cloudflare-comic-pages-rename';
import renamePagesToTempLocally from '../file-handling/local-comic-pages-rename';

const renamePagesToTempFunc =
  process.env.LOCAL_DEV === 'true' ? renamePagesToTempLocally : renamePagesToTempInR2;
const deletePageFileFunc =
  process.env.LOCAL_DEV === 'true' ? deletePageLocally : deletePageFromR2;

export async function handleDeleteAndCopyStep1(req: Request, res: Response) {
  try {
    console.log('delete-and-copy-step1');

    if (!req.body.comicName || !req.body.deletedPagesNumbers) {
      console.log('⛔ Comic name and deleted pages numbers are required.');
      return res.status(400).send('Comic name and deleted pages numbers are required.');
    }

    const comicName = req.body.comicName as string;
    const deletedPagesNumbers: number[] = req.body.deletedPagesNumbers;
    let skipProcessingPagesUntilIncl = req.body.skipProcessingPagesUntilIncl;
    if (!skipProcessingPagesUntilIncl || Number.isNaN(skipProcessingPagesUntilIncl)) {
      skipProcessingPagesUntilIncl = 0;
    } else {
      skipProcessingPagesUntilIncl = parseInt(skipProcessingPagesUntilIncl);
    }

    // Delete pages
    if (deletedPagesNumbers && deletedPagesNumbers.length > 0) {
      for (const pageNumber of deletedPagesNumbers) {
        const pageNumStr = padPageNumber(pageNumber);
        await deletePageFileFunc(comicName, `${pageNumStr}.jpg`);
        await deletePageFileFunc(comicName, `${pageNumStr}.webp`);
      }
    }

    await renamePagesToTempFunc(comicName, skipProcessingPagesUntilIncl);

    console.log('Finished deleteing and renaming pages to "-temp"!');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to rearrange comic.');
  }

  return res.status(200).send('Rearranged comic successfully.');
}
