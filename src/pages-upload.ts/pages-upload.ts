import sharp from 'sharp';
import { PageForUpload } from '../types';
import { MAX_PAGE_WIDTH } from '../constants';
import { padPageNumber } from '../utils';
import { savePageFilesLocally } from '../file-handling/local-page-saver';
import { sendPageFilesToR2 } from '../file-handling/cloudflare-page-saver';

const savePageFilesFunc =
  process.env.LOCAL_DEV === 'true' ? savePageFilesLocally : sendPageFilesToR2;

export async function addPagesToComic(
  comicName: string,
  pages: Express.Multer.File[],
  pageNums?: number[]
): Promise<boolean> {
  const pageObjects: PageForUpload[] = [];

  console.log(`Processing ${pages.length} pages.`);

  for (let i = 0; i < pages.length; i++) {
    const file = pages[i];
    const pageNumber = pageNums
      ? pageNums[i]
      : getPageNumberFromFilename(file.originalname);
    console.log(` Processing page ${pageNumber}...`);
    const pageFiles = await processPageFile(file, pageNumber);
    pageObjects.push(...pageFiles);
  }

  console.log('Processed pages.');

  const pageSuccess = await savePageFilesFunc(comicName, pageObjects);
  return pageSuccess;
}

async function processPageFile(
  file: Express.Multer.File,
  pageNumber: number
): Promise<PageForUpload[]> {
  const sharpFile = sharp(file.buffer);
  const metadata = await sharpFile.metadata();
  const width = metadata.width;
  if (!width) return [];

  const isOverMaxWidth = width > MAX_PAGE_WIDTH;
  const resizedSharp = isOverMaxWidth ? sharpFile.resize(MAX_PAGE_WIDTH) : sharpFile;

  const webpFile = await resizedSharp.webp({ quality: 80 }).toBuffer();
  const jpegFile = await resizedSharp.jpeg({ quality: 80 }).toBuffer();

  return [
    {
      buffer: webpFile,
      fileType: 'webp',
      newFileName: makePageFilename(pageNumber, 'webp'),
    },
    {
      buffer: jpegFile,
      fileType: 'jpg',
      newFileName: makePageFilename(pageNumber, 'jpg'),
    },
  ];
}

function getPageNumberFromFilename(filename: string) {
  const match = filename.match(/(\d+)\./);
  if (!match) {
    throw new Error(`Failed to extract page number from filename: ${filename}`);
  }
  return parseInt(match[1]);
}

function makePageFilename(pageNumber: number, fileType: string) {
  return `${padPageNumber(pageNumber)}.${fileType}`;
}
