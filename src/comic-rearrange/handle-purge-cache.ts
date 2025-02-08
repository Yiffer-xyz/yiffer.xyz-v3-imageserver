import { Request, Response } from 'express';
import { purgeComicPagesFromCache } from '../cloudflare-utils';

export async function handlePurgeCache(req: Request, res: Response) {
  try {
    console.log('Handling purge cache');

    const numberOfPages = req.body.numberOfPages;
    const comicName = req.body.comicName as string;

    if (!numberOfPages || !comicName) {
      return res.status(400).send('Missing numberOfPages or comicName');
    }

    const pageNumArray = Array.from({ length: numberOfPages }, (_, i) => i + 1);

    await purgeComicPagesFromCache(comicName, pageNumArray, true);

    console.log('Finished purging cache!');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to purge cache.');
  }

  return res.status(200).send('Purged cache successfully.');
}
