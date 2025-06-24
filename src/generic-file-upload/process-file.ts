import sharp from 'sharp';
import { FileFormat } from '../types';
import { Request, Response } from 'express';
import { sendGenericFileToR2 } from '../file-handling/cloudflare-page-saver';
import { saveGenericFileLocally } from '../file-handling/local-file-saver';

const saveFileFunc =
  process.env.LOCAL_DEV === 'true' ? saveGenericFileLocally : sendGenericFileToR2;

type ProcessFileBody = {
  formats: FileFormat[];
  resizes?: {
    width: number;
    height: number;
    suffix?: string;
  }[];
  quality?: number;
  maxWidth?: number;
};

export async function handleFileUpload(req: Request, res: Response) {
  if (!req.files) {
    console.log('⛔ No files included in request.');
    return res.status(400).send('No files included in request.');
  }
  if (!Array.isArray(req.files)) {
    console.log('⛔ Invalid request files structure.');
    return res.status(400).send('Invalid request files structure.');
  }

  console.log('\nHandling file upload of ', req.files.length, 'files.');

  const reqBody = JSON.parse(req.body.argsJson.toString()) as ProcessFileBody;
  if (!reqBody.formats) {
    console.log('⛔ Request body missing formats');
    return res.status(400).send('Request body missing formats');
  }
  const files = req.files as Express.Multer.File[];

  const buffersWithNames = await processFiles({ files, ...reqBody });

  const saveSuccess = await saveFileFunc(buffersWithNames);

  if (!saveSuccess) {
    console.log('⛔ Failed to save files.');
    return res.status(500).send('Failed to save files.');
  }

  console.log('✅ Files saved successfully.');

  return res.status(200).json({
    success: true,
    filenames: buffersWithNames.map(file => file.filename),
  });
}

// Expects input files to be of form <token>.<extension>
export async function processFiles({
  files,
  resizes,
  quality,
  formats,
  maxWidth,
}: {
  files: Express.Multer.File[];
} & ProcessFileBody): Promise<{ buffer: Buffer; filename: string }[]> {
  const allProcessedFiles: { buffer: Buffer; filename: string }[] = [];

  for (const file of files) {
    const processedFiles = await processFile({
      file,
      formats,
      resizes,
      quality,
      maxWidth,
    });
    allProcessedFiles.push(...processedFiles);
  }

  return allProcessedFiles;
}

export async function processFile({
  file,
  formats,
  resizes,
  quality = 90,
  maxWidth,
}: {
  file: Express.Multer.File;
} & ProcessFileBody): Promise<{ buffer: Buffer; filename: string }[]> {
  const processedFiles: { buffer: Buffer; filename: string }[] = [];

  const fileToken = file.originalname.split('.')[0];

  for (const format of formats) {
    if (resizes) {
      for (const resize of resizes) {
        const sharpFile = sharp(file.buffer);
        sharpFile.resize(resize.width, resize.height);
        if (format === 'webp') {
          sharpFile.webp({ quality });
        } else if (format === 'jpg') {
          sharpFile.jpeg({ quality });
        }
        const newFileName = resize.suffix
          ? `${fileToken}-${resize.suffix}.${format}`
          : `${fileToken}.${format}`;
        processedFiles.push({
          buffer: await sharpFile.toBuffer(),
          filename: newFileName,
        });
      }
    } else {
      const sharpFile = sharp(file.buffer);
      if (maxWidth) {
        const meta = await sharpFile.metadata();
        if (meta.width && meta.width > maxWidth) {
          sharpFile.resize(maxWidth);
        }
      }
      if (format === 'webp') {
        sharpFile.webp({ quality });
      } else if (format === 'jpg') {
        sharpFile.jpeg({ quality });
      }
      processedFiles.push({
        buffer: await sharpFile.toBuffer(),
        filename: `${fileToken}.${format}`,
      });
    }
  }

  return processedFiles;
}
