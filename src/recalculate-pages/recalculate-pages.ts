import { Request, Response } from 'express';
import {
  rearrangeComicPages,
  UpdatedComicPage,
} from '../comic-rearrange/comic-rearrange';
import { padPageNumber } from '../utils';
import getPageNumsLocally from '../file-handling/local-get-pagenames';
import getPageNamesCloudflare from '../file-handling/cloudflare-get-pagenames';

const getPageNamesFunc =
  process.env.NODE_ENV === 'development' ? getPageNumsLocally : getPageNamesCloudflare;

export default async function handleRecalculatePages(req: Request, res: Response) {
  const comicName = req.body.comicName;

  console.log(`Recalculating pages for ${comicName}`);

  try {
    const { pageNums: existingPageNums, pageNames: existingPageNames } =
      await getPageNamesFunc(comicName);
    const existingNumPages = new Set(existingPageNums).size;
    const updatedPages: UpdatedComicPage[] = [];

    for (let i = 1; i <= existingNumPages; i++) {
      const pageNumStr = padPageNumber(i);
      // Must have both jpg and webp, or else, delete it.
      if (
        !existingPageNames.includes(`${pageNumStr}.jpg`) ||
        !existingPageNames.includes(`${pageNumStr}.webp`)
      ) {
        updatedPages.push({ isDeleted: true, previousPos: i });
        if (updatedPages.length === 1) {
          for (let j = i + 1; j <= existingNumPages; j++) {
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
    const { pageNames: existingPageNames2, pageNums: existingPageNums2 } =
      await getPageNamesFunc(comicName);
    const existingNumPages2 = new Set(existingPageNums2).size;

    const lastExistingPageNum = existingPageNums2[existingPageNums2.length - 1];
    if (lastExistingPageNum !== existingNumPages2) {
      isTrailingLastPage = true;
      await rearrangeComicPages(comicName, [
        { previousPos: lastExistingPageNum, newPos: existingNumPages2, isDeleted: false },
      ]);
    }

    console.log('Finished recalculating pages.');
    return res.json({
      newNumPages:
        existingNumPages -
        updatedPages.filter(page => page.isDeleted).length +
        (isTrailingLastPage ? 1 : 0),
      wasChanged: updatedPages.length > 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to recalculate pages.');
  }
}
