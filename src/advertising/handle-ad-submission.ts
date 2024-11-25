import { Request, Response } from 'express';
import sharp from 'sharp';
import { AdFileForUpload } from '../types';
import { saveAdFilesLocally } from '../file-handling/local-ad-saver';
import { sendAdFilesToR2 } from '../file-handling/cloudflare-ad-saver';
import { deleteAdsFromR2 } from '../file-handling/cloudflare-comic-delete';
import {
  ADVERTISEMENTS,
  AdType,
  BASE_THUMB_HEIGHT,
  BASE_THUMB_WIDTH,
  isAdType,
} from '../constants';
import { getFileExtension } from '../utils';

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
  const adType = req.body.adType;
  const file = req.file;

  if (!adId || !file || !adType || !isAdType(adType)) {
    console.log('⛔ Ad ID, file, and adType are required, but are:', adId, file, adType);
    return res.status(400).send('Ad ID, file, and adType are required');
  }

  if (!legalFileMimeTypes.includes(file.mimetype)) {
    console.log('⛔ Illegal file type:', file.mimetype);
    return res.status(400).send('Illegal file type');
  }

  let filesForUpload: AdFileForUpload[] = [];

  if (isAnimated(file)) {
    filesForUpload = await processVideoOrGif(file);
  } else if (isVideoIllegalType(file)) {
    return res.status(400).send('Invalid video file type');
  } else {
    filesForUpload = await processImageFile(file, adType);
  }

  const adSuccess = await saveAdFunc(adId, filesForUpload);
  if (!adSuccess) {
    await deleteAdsFunc(adId);
    console.log('⛔ Failed to upload ad files, ID', adId);
    return res.status(500).send('Failed to upload ad files.');
  }

  console.log('Ad handled, ID', adId);
  res.status(200).send('Ad handled');
}

async function processVideoOrGif(file: Express.Multer.File): Promise<AdFileForUpload[]> {
  return [
    {
      buffer: file.buffer,
      multiplier: 1,
      fileType: getFileExtension(file.originalname),
    },
  ];
}

async function processImageFile(
  file: Express.Multer.File,
  adType: AdType
): Promise<AdFileForUpload[]> {
  const filesForUpload: AdFileForUpload[] = [];
  const sizes = getWidthHeightsForAdType(adType);

  const sharpFile = sharp(file.buffer);
  const fileWidth = (await sharpFile.metadata()).width;

  for (const { width, height, multiplier } of sizes) {
    const bufferWebp = await sharpFile
      .resize(width, height)
      .webp({ quality: 80 })
      .toBuffer();
    filesForUpload.push({ buffer: bufferWebp, multiplier, fileType: 'webp' });

    if (file.mimetype === 'image/jpeg' && fileWidth === width) {
      filesForUpload.push({ buffer: file.buffer, multiplier, fileType: 'jpg' });
    } else {
      const bufferJpeg = await sharpFile
        .resize(width, height)
        .jpeg({ quality: 80 })
        .toBuffer();
      filesForUpload.push({ buffer: bufferJpeg, multiplier, fileType: 'jpg' });
    }
  }

  return filesForUpload;
}

function isGif(file: Express.Multer.File) {
  return file.mimetype === 'image/gif';
}

function isAnimated(file: Express.Multer.File) {
  return (
    file.mimetype === 'image/gif' ||
    file.mimetype === 'video/mp4' ||
    file.mimetype === 'video/webm'
  );
}

function isVideoIllegalType(file: Express.Multer.File) {
  return file.mimetype.startsWith('video/') && !isAnimated(file);
}

function getWidthHeightsForAdType(
  adType: AdType
): { width: number; height: number; multiplier: number }[] {
  switch (adType) {
    case 'card':
      return [
        { width: BASE_THUMB_WIDTH * 2, height: BASE_THUMB_HEIGHT * 2, multiplier: 2 },
        { width: BASE_THUMB_WIDTH * 3, height: BASE_THUMB_HEIGHT * 3, multiplier: 3 },
      ];
    case 'banner':
      const bannerAd = ADVERTISEMENTS.find(ad => ad.name === 'banner');
      return [
        {
          width: bannerAd!.minDimensions.width,
          height: bannerAd!.minDimensions.height,
          multiplier: 1,
        },
        {
          width: bannerAd!.idealDimensions!.width,
          height: bannerAd!.idealDimensions!.height,
          multiplier: 2,
        },
      ];
    case 'topSmall':
      const topSmallAd = ADVERTISEMENTS.find(ad => ad.name === 'topSmall');
      return [
        {
          width: topSmallAd!.minDimensions.width,
          height: topSmallAd!.minDimensions.height,
          multiplier: 1,
        },
        {
          width: topSmallAd!.idealDimensions!.width,
          height: topSmallAd!.idealDimensions!.height,
          multiplier: 2,
        },
      ];
    default:
      return [];
  }
}
