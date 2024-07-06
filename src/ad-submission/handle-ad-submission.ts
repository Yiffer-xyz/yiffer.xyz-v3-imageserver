import { Request, Response } from 'express';
import sharp from 'sharp';
import { AdFileForUpload } from '../types';
import { saveAdFilesLocally } from '../file-handling/local-ad-saver';
import { sendAdFilesToR2 } from '../file-handling/cloudflare-ad-saver';
import { deleteAdsFromR2 } from '../file-handling/cloudflare-comic-delete';
import {
  BASE_THUMB_HEIGHT,
  BASE_THUMB_WIDTH,
  MULTIPLIERS_TO_MAKE_THUMBNAILS,
} from '../constants';

const legalFileMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'image/gif',
];

const saveAdFunc =
  process.env.LOCAL_DEV === 'true' ? saveAdFilesLocally : sendAdFilesToR2;
const deleteAdsFunc = process.env.LOCAL_DEV === 'true' ? () => {} : deleteAdsFromR2;

export default async function handleAdSubmission(req: Request, res: Response) {
  console.log('Handling ad submission');

  const adId = req.body.adId;
  const file = req.file;

  if (!adId || !file) {
    console.log('⛔ Ad ID and file are required, but are:', adId, file);
    return res.status(400).send('Ad ID and file are required');
  }

  if (!legalFileMimeTypes.includes(file.mimetype)) {
    console.log('⛔ Illegal file type:', file.mimetype);
    return res.status(400).send('Illegal file type');
  }

  let pagesForUpload: AdFileForUpload[] = [];

  if (isAnimated(file)) {
    console.log('⛔ Animated ads are not allowed');
    return res.status(400).send('Not implemented yet');
  } else {
    pagesForUpload = await processImageFile(file);
  }

  const adSuccess = await saveAdFunc(adId, pagesForUpload);
  if (!adSuccess) {
    await deleteAdsFunc(adId);
    console.log('⛔ Failed to upload ad files, ID', adId);
    return res.status(500).send('Failed to upload ad files.');
  }

  console.log('Ad handled, ID', adId);
  res.status(200).send('Ad handled');
}

async function processImageFile(file: Express.Multer.File): Promise<AdFileForUpload[]> {
  const filesForUpload: AdFileForUpload[] = [];
  const [w, h] = [BASE_THUMB_WIDTH, BASE_THUMB_HEIGHT];

  const sharpFile = sharp(file.buffer);
  const fileWidth = (await sharpFile.metadata()).width;

  // Make webp
  for (const multiplier of MULTIPLIERS_TO_MAKE_THUMBNAILS) {
    // no need to resize and reduce quality if uploaded file is correct size and webp
    if (file.mimetype === 'image/webp' && fileWidth === w * multiplier) {
      filesForUpload.push({ buffer: file.buffer, multiplier, fileType: 'webp' });
    }
    const buffer = await sharpFile
      .resize(w * multiplier, h * multiplier)
      .webp({ quality: 80 })
      .toBuffer();
    filesForUpload.push({ buffer, multiplier, fileType: 'webp' });
  }

  // Make jpeg
  for (const multiplier of MULTIPLIERS_TO_MAKE_THUMBNAILS) {
    // no need to resize and reduce quality if uploaded file is correct size and jpeg
    if (file.mimetype === 'image/jpeg' && fileWidth === w * multiplier) {
      filesForUpload.push({ buffer: file.buffer, multiplier, fileType: 'jpg' });
    } else {
      const buffer = await sharpFile
        .resize(w * multiplier, h * multiplier)
        .jpeg({ quality: 80 })
        .toBuffer();
      filesForUpload.push({ buffer, multiplier, fileType: 'jpg' });
    }
  }

  return filesForUpload;
}

function isAnimated(file: Express.Multer.File) {
  return (
    file.mimetype === 'image/gif' ||
    file.mimetype === 'video/mp4' ||
    file.mimetype === 'video/webm'
  );
}
