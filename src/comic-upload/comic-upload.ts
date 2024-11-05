import { Request, Response } from 'express';
import sharp from 'sharp';
import {
  BASE_THUMB_WIDTH,
  BASE_THUMB_HEIGHT,
  MULTIPLIERS_TO_MAKE_THUMBNAILS,
  MAX_PAGE_WIDTH,
} from '../constants';
import { sendThumbnailFilesToR2 } from '../file-handling/cloudflare-page-saver';
import { PageForUpload, ThumbnailForUpload } from '../types';
import { deleteComicFromR2 } from '../file-handling/cloudflare-comic-delete';
import { saveThumbnailFilesLocally } from '../file-handling/local-page-saver';
import { deleteComicLocally } from '../file-handling/local-comic-delete';
import { padPageNumber } from '../utils';
import { addPagesToComic } from '../pages-upload.ts/pages-upload';

const saveThumbnailFilesFunc =
  process.env.LOCAL_DEV === 'true' ? saveThumbnailFilesLocally : sendThumbnailFilesToR2;
const deleteComicFunc =
  process.env.LOCAL_DEV === 'true' ? deleteComicLocally : deleteComicFromR2;

export async function handleUpload(req: Request, res: Response) {
  console.log('Handling upload');

  if (!req.files) {
    console.log('⛔ No files were uploaded.');
    return res.status(400).send('No files were uploaded.');
  }
  if (Array.isArray(req.files)) {
    console.log('⛔ Invalid request body structure.');
    return res.status(400).send('Invalid request body structure.');
  }
  if (!req.body.comicName || !req.body.uploadId) {
    console.log('⛔ Comic name and uploadId is required.');
    return res.status(400).send('Comic name and uploadId is required.');
  }

  const comicName = req.body.comicName as string;
  const pageFiles = req.files['pages'] as Express.Multer.File[];
  const thumbnailFiles = req.files['thumbnail'] as Express.Multer.File[];
  console.log(
    `Comic name: ${comicName}. Num pages: ${pageFiles.length}. Num thumbnails: ${thumbnailFiles.length}.`
  );

  const thumbnailObjects = await processThumbnailFile(thumbnailFiles[0]);
  console.log('Processed thumbnail.');
  const thumbnailSuccess = await saveThumbnailFilesFunc(comicName, thumbnailObjects);
  if (!thumbnailSuccess) {
    await deleteComicFunc(comicName);
    console.log('⛔ Failed to upload thumbnail files to R2.');
    return res.status(500).send('Failed to upload thumbnail files to R2.');
  }
  console.log('Uploaded thumbnail.');

  const pageSuccess = await addPagesToComic(comicName, pageFiles);
  if (!pageSuccess) {
    await deleteComicFunc(comicName);
    console.log('⛔ Failed to upload page files to R2.');
    return res.status(500).send('Failed to upload page files to R2.');
  }
  console.log('✅ Upload successful!');

  return res.status(200).send('Upload successful');
}

export async function processThumbnailFile(
  file: Express.Multer.File
): Promise<ThumbnailForUpload[]> {
  const [w, h] = [BASE_THUMB_WIDTH, BASE_THUMB_HEIGHT];

  const webpFiles = MULTIPLIERS_TO_MAKE_THUMBNAILS.map(multiplier => ({
    file: sharp(file.buffer)
      .resize(w * multiplier, h * multiplier)
      .webp({ quality: 80 }),
    width: w * multiplier,
    multiplier,
    fileType: 'webp',
  }));

  const jpegFiles = MULTIPLIERS_TO_MAKE_THUMBNAILS.map(multiplier => ({
    file: sharp(file.buffer)
      .resize(w * multiplier, h * multiplier)
      .jpeg({ quality: 80 }),
    width: w * multiplier,
    multiplier,
    fileType: 'jpg',
  }));

  const convertedFiles = [];

  for (const { file, width, fileType, multiplier } of [...webpFiles, ...jpegFiles]) {
    const buffer = await file.toBuffer();
    convertedFiles.push({
      buffer,
      width,
      fileType,
      multiplier,
      filenameBase: 'thumbnail',
    });
  }

  return convertedFiles;
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
