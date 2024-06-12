import { readFileSync } from 'fs';
import { localDataPath } from '../utils';
import { Request, Response } from 'express';

export async function serveFile(req: Request, res: Response): Promise<Response> {
  const comicName = req.params.comicName;
  const fileName = req.params.fileName;

  const filePath = `${localDataPath}/${comicName}/${fileName}`;

  const mimeType = fileName.endsWith('.jpg') ? 'image/jpeg' : 'image/webp';
  try {
    const file = readFileSync(filePath);

    const headers = new Headers();
    headers.set('Content-Type', mimeType);

    return res.status(200).send(file);
  } catch {
    console.log('Not found: ', filePath);
    return res.status(404).send('File not found');
  }
}
