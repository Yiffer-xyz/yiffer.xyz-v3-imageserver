import dotenv from 'dotenv';
dotenv.config();

import './file-handling/local-page-saver';
import express, { Request, Response, Router } from 'express';
import { handleUpload } from './comic-upload/comic-upload';
import multer from 'multer';
import cors from 'cors';
import { serveFile } from './local-file-serve/serve-file';
import { handleErrorLog, serveErrorLogs } from './temp-logging/temp-logging-handlers';
import { handleRearrange } from './comic-rearrange/comic-rearrange';
import { handlePageAdditions } from './pages-upload.ts/handle-page-additions';
import handleAdSubmission from './ad-submission/handle-ad-submission';
import handleRename from './comic-rename/comic-rename';
import handleRecalculatePages from './recalculate-pages/recalculate-pages';

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
  upload.fields([{ name: 'pages' }, { name: 'thumbnail', maxCount: 1 }]),
  handleUpload
);

app.post('/add-pages', upload.fields([{ name: 'pages' }]), handlePageAdditions);

app.post('/rearrange-comic', upload.any(), handleRearrange);

app.post('/rename-comic', handleRename);

app.post('/recalculate-pages', handleRecalculatePages);

app.post('/submit-ad', upload.single('adFile'), handleAdSubmission);

app.post('/update-ad', upload.single('adFile'), (req, res) =>
  handleAdSubmission(req, res)
);

app.get('/:comicName/:fileName', serveFile);

// Just for now, error logging for dev
app.post('/error-log', handleErrorLog);
app.get('/error-log', serveErrorLogs);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Local dev: ${process.env.LOCAL_DEV}`);
});
