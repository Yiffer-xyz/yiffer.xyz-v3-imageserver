import { Request, Response } from 'express';
import { sendGenericFileToR2 } from '../file-handling/cloudflare-page-saver';
import sharp from 'sharp';
import { PROFILE_PIC_SIZE } from '../constants';
import { generateToken, isValidToken } from '../utils';
import { saveGenericFileLocally } from '../file-handling/local-file-saver';

const saveFileFunc =
  process.env.LOCAL_DEV === 'true' ? saveGenericFileLocally : sendGenericFileToR2;

export async function handleGenericFileUpload(req: Request, res: Response) {
  console.log('Handling file upload');

  if (!req.file) {
    console.log('⛔ No file was uploaded.');
    return res.status(400).send('No file was uploaded.');
  }

  const tempToken = generateToken();

  const fileObjects = await processFile(req.file);
  console.log(`Processed file.`);

  const fileSuccess = await saveFileFunc(fileObjects, tempToken);
  if (!fileSuccess) {
    console.log('⛔ Failed to upload file.');
    return res.status(500).send('Failed to upload file.');
  }

  console.log(`✅ File upload successful. Token: ${tempToken}.`);
  return res.status(200).json({ tempToken });
}

export async function processFile(
  file: Express.Multer.File
): Promise<{ buffer: Buffer; fileType: string }[]> {
  const webpFile = {
    buffer: await sharp(file.buffer)
      .resize(PROFILE_PIC_SIZE, PROFILE_PIC_SIZE)
      .webp({ quality: 90 })
      .toBuffer(),
    fileType: 'webp',
  };

  const jpegFile = {
    buffer: await sharp(file.buffer)
      .resize(PROFILE_PIC_SIZE, PROFILE_PIC_SIZE)
      .jpeg({ quality: 90 })
      .toBuffer(),
    fileType: 'jpg',
  };

  return [webpFile, jpegFile];
}
