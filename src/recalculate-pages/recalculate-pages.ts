import { Request, Response } from 'express';
import {
  rearrangeComicPages,
  UpdatedComicPage,
} from '../comic-rearrange/comic-rearrange';
import { readdirSync } from 'fs';
import { localDataPath, padPageNumber } from '../utils';

export default async function handleRecalculatePages(req: Request, res: Response) {
  const comicName = req.body.comicName;

  console.log(`Recalculating pages for ${comicName}`);

  try {
    const pages = readdirSync(`${localDataPath}/${comicName}`);
    const allPageNums = pages
      .filter(
        page =>
          (page.endsWith('.jpg') || page.endsWith('webp')) && !page.includes('thumbnail')
      )
      .map(page => parseInt(page.split('.')[0]))
      .sort((a, b) => a - b);
    const dirNumPages = new Set(allPageNums).size;

    const updatedPages: UpdatedComicPage[] = [];

    for (let i = 1; i <= dirNumPages; i++) {
      const pageNumStr = padPageNumber(i);
      // Must have both jpg and webp, or else, delete it.
      if (!pages.includes(`${pageNumStr}.jpg`) || !pages.includes(`${pageNumStr}.webp`)) {
        updatedPages.push({ isDeleted: true, previousPos: i });
        if (updatedPages.length === 1) {
          for (let j = i + 1; j <= dirNumPages; j++) {
            updatedPages.push({ previousPos: j, newPos: j - 1, isDeleted: false });
          }
        } else {
          updatedPages.forEach(page => {
            if (page.previousPos! > i) {
              page.newPos = page.newPos! - 1;
            }
          });
        }
      }
    }

    await rearrangeComicPages(comicName, updatedPages);

    // Edge case where we have 0001, 0002, 0003, ... 0005 (or more). Last one gets stuck.
    let isTrailingLastPage = false;
    const pages2 = readdirSync(`${localDataPath}/${comicName}`);
    const allPageNums2 = pages2
      .filter(
        page =>
          (page.endsWith('.jpg') || page.endsWith('webp')) && !page.includes('thumbnail')
      )
      .map(page => parseInt(page.split('.')[0]))
      .sort((a, b) => a - b);
    const dirNumPages2 = new Set(allPageNums).size;

    const lastPageDirNum = allPageNums2[allPageNums2.length - 1];
    if (lastPageDirNum !== dirNumPages2) {
      isTrailingLastPage = true;
      await rearrangeComicPages(comicName, [
        { previousPos: lastPageDirNum, newPos: dirNumPages2, isDeleted: false },
      ]);
    }

    console.log('Finished recalculating pages.');
    return res.json({
      newNumPages:
        dirNumPages -
        updatedPages.filter(page => page.isDeleted).length +
        (isTrailingLastPage ? 1 : 0),
      wasChanged: updatedPages.length > 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to recalculate pages.');
  }
}
