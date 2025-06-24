import { readFileSync } from 'fs';
import { localDataPath } from '../utils';
import { Request, Response } from 'express';
import { R2_PROFILE_PHOTOS_FOLDER } from '../constants';

export async function serveComicPageFile(req: Request, res: Response) {
  const comicId = req.params.comicId;
  const pageToken = req.params.pageToken;
  const filePath = `${localDataPath}/comics/${comicId}/${pageToken}`;
  serveFile(filePath, res);
}

export async function serveProfilePicFile(req: Request, res: Response) {
  const token = req.params.token;
  const filePath = `${localDataPath}/${R2_PROFILE_PHOTOS_FOLDER}/${token}`;
  serveFile(filePath, res);
}

async function serveFile(filePath: string, res: Response): Promise<Response> {
  const mimeType = filePath.endsWith('.jpg') ? 'image/jpeg' : 'image/webp';
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
