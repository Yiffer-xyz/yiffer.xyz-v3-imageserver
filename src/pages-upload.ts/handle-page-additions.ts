import { Request, Response } from 'express';
import { addPagesToComic } from './pages-upload';

export async function handlePageAdditions(req: Request, res: Response) {
  console.log('Handling page additions');

  if (!req.files) {
    console.log('⛔ No files were uploaded.');
    return res.status(400).send('No files were uploaded.');
  }
  if (Array.isArray(req.files)) {
    console.log('⛔ Invalid request body structure.');
    return res.status(400).send('Invalid request body structure.');
  }
  if (!req.body.comicName || !req.body.pageNums) {
    console.log('⛔ Comic name and pageNums are required.');
    return res.status(400).send('Comic name and pageNums are required.');
  }

  const comicName = req.body.comicName as string;
  const pageNumsStr = req.body.pageNums as string;
  const pageNums = pageNumsStr.split(',').map(num => parseInt(num));
  const pageFiles = req.files['pages'] as Express.Multer.File[];
  console.log(`Comic name: ${comicName}. Num pages: ${pageFiles.length}.`);

  const pageSuccess = await addPagesToComic(comicName, pageFiles, pageNums);
  if (!pageSuccess) {
    console.log('⛔ Failed to upload page files to R2.');
    return res.status(500).send('Failed to upload page files to R2.');
  }

  console.log('Page addition successful!');
  return res.status(200).send('Upload successful');
}
