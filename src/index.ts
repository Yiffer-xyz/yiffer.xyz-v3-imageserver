import dotenv from 'dotenv';
dotenv.config();

import './file-handling/local-page-saver';
import express, { Request, Response } from 'express';
import { handleUpload } from './comic-upload/comic-upload';
import multer from 'multer';
import cors from 'cors';
import { serveFile } from './local-file-serve/serve-file';
import {
  clearLogs,
  handleErrorLog,
  serveErrorLogs,
} from './temp-logging/temp-logging-handlers';
import { handleRearrange } from './comic-rearrange/comic-rearrange';
import { handlePageAdditions } from './pages-upload.ts/handle-page-additions';
import handleAdSubmission from './advertising/handle-ad-submission';
import handleRename from './comic-rename/comic-rename';
import handleRecalculatePages from './recalculate-pages/recalculate-pages';
import { handleChangeThumbnail } from './change-thumbnail/change-thumbnail';
import handleAdDelete from './advertising/handle-delete-ad';
import handlePatrons from './patreon/patronsHandler';
import { handleDeleteAndCopyStep1 } from './comic-changes-new/handleDeleteAndCopyStep1';
import { handleRearrangeStep3 } from './comic-changes-new/handleRearrangeStep3';
import { handlePurgeCache } from './comic-rearrange/handle-purge-cache';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
const port = 8770;

app.use(express.json());
app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Yiffer Images Server 👋');
});

app.post(
  '/comic-upload',
  <any>upload.fields([{ name: 'pages' }, { name: 'thumbnail', maxCount: 1 }]),
  handleUpload
);

app.post('/delete-and-copy-step1', handleDeleteAndCopyStep1);
app.post('/rearrange-step3', handleRearrangeStep3);

app.post('/add-pages', <any>upload.fields([{ name: 'pages' }]), handlePageAdditions);

app.post('/change-thumbnail', <any>upload.single('thumbnail'), handleChangeThumbnail);

app.post('/rearrange-comic', <any>upload.any(), handleRearrange);

app.post('/purge-comic-cache', handlePurgeCache);

app.post('/rename-comic', handleRename);

app.post('/recalculate-pages', handleRecalculatePages);

app.post('/submit-ad', <any>upload.single('adFile'), (req, res) =>
  handleAdSubmission(req, res)
);

app.post('/update-ad', <any>upload.single('adFile'), (req, res) =>
  handleAdSubmission(req, res)
);

app.post('/delete-ad', handleAdDelete);

app.get('/:comicName/:fileName', serveFile);

// Just for now, error logging for dev
app.post('/error-log', handleErrorLog);
app.get('/error-log', serveErrorLogs);
app.get('/clear-error-logs', clearLogs);

app.get('/patrons', handlePatrons);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Local dev: ${process.env.LOCAL_DEV}`);
});
