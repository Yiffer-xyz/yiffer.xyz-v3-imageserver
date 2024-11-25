import { Request, Response } from 'express';
import { deleteAdsFromR2 } from '../file-handling/cloudflare-comic-delete';
import { deleteAdLocally } from '../file-handling/local-ad-delete';

const deleteAdsFunc =
  process.env.LOCAL_DEV === 'true' ? deleteAdLocally : deleteAdsFromR2;

export default async function handleAdDelete(req: Request, res: Response) {
  console.log('Handling ad delete');

  const adId = req.body.adId;
  if (!adId) {
    return res.status(400).send('Ad ID is required');
  }

  await deleteAdsFunc(adId);

  console.log('🗑️ Ad deleted', adId);
  res.status(200).send('Ad deleted');
}
