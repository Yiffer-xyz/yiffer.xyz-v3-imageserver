import { Request, Response } from 'express';
import sharp from 'sharp';
import {
  BASE_THUMB_WIDTH,
  BASE_THUMB_HEIGHT,
  MULTIPLIERS_TO_MAKE_THUMBNAILS,
  MAX_PAGE_WIDTH,
} from '../constants';
import { sendThumbnailFilesToR2, sendPageFilesToR2 } from './cloudflare-page-saver';
import { PageForUpload, ThumbnailForUpload } from '../types';
import { deleteComicFromR2 } from '../comic-delete/cloudflare-comic-delete';
import { savePageFilesLocally, saveThumbnailFilesLocally } from './local-page-saver';
import { deleteComicLocally } from '../comic-delete/local-comic-delete';

const savePageFilesFunc =
  process.env.LOCAL_DEV === 'true' ? savePageFilesLocally : sendPageFilesToR2;
const saveThumbnailFilesFunc =
  process.env.LOCAL_DEV === 'true' ? saveThumbnailFilesLocally : sendThumbnailFilesToR2;
const deleteComicFunc =
  process.env.LOCAL_DEV === 'true' ? deleteComicLocally : deleteComicFromR2;

export async function handleUpload(req: Request, res: Response) {
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }
  if (Array.isArray(req.files)) {
    return res.status(400).send('Invalid request body structure.');
  }
  if (!req.body.comicName || !req.body.uploadId) {
    return res.status(400).send('Comic name and uploadId is required.');
  }

  const comicName = req.body.comicName as string;
  const pageFiles = req.files['pages'] as Express.Multer.File[];
  const thumbnailFiles = req.files['thumbnail'] as Express.Multer.File[];

  const thumbnailObjects = await processThumbnailFile(thumbnailFiles[0]);
  const thumbnailSuccess = await saveThumbnailFilesFunc(comicName, thumbnailObjects);
  if (!thumbnailSuccess) {
    await deleteComicFunc(comicName);
    return res.status(500).send('Failed to upload thumbnail files to R2.');
  }

  const pageObjects = await processPageFiles(pageFiles);
  const pageSuccess = await savePageFilesFunc(comicName, pageObjects);
  if (!pageSuccess) {
    await deleteComicFunc(comicName);
    return res.status(500).send('Failed to upload page files to R2.');
  }

  return res.status(200).send('Upload successful');
}

async function processThumbnailFile(
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

async function processPageFiles(files: Express.Multer.File[]): Promise<PageForUpload[]> {
  const returnFiles: PageForUpload[] = [];

  for (const file of files) {
    const sharpFile = sharp(file.buffer);
    const metadata = await sharpFile.metadata();
    const width = metadata.width;
    if (!width) continue;
    const isOverMaxWidth = width > MAX_PAGE_WIDTH;
    const resizedSharp = isOverMaxWidth ? sharpFile.resize(MAX_PAGE_WIDTH) : sharpFile;

    const webpFile = await resizedSharp.webp({ quality: 80 }).toBuffer();
    const jpegFile = await resizedSharp.jpeg({ quality: 80 }).toBuffer();

    returnFiles.push({
      buffer: webpFile,
      fileType: 'webp',
      newFileName: makePageFilename(file.originalname, 'webp'),
    });
    returnFiles.push({
      buffer: jpegFile,
      fileType: 'jpg',
      newFileName: makePageFilename(file.originalname, 'jpg'),
    });
  }

  return returnFiles;
}

function makePageFilename(originalFilename: string, newFileType: string) {
  return originalFilename.replace(/\..+$/, `.${newFileType}`);
}
