import dotenv from 'dotenv';
dotenv.config();
import './file-handling/local-file-saver';
import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import { serveComicPageFile, serveProfilePicFile } from './local-file-serve/serve-file';
import {
  clearLogs,
  handleErrorLog,
  serveErrorLogs,
} from './temp-logging/temp-logging-handlers';
import handleAdSubmission from './advertising/handle-ad-submission';
import handleAdDelete from './advertising/handle-delete-ad';
import { handleLocalDevManageFiles } from './file-handling/handle-local-dev-manage-files';
import { handleFileUpload } from './generic-file-upload/process-file';
import { R2_COMICS_FOLDER, R2_PROFILE_PHOTOS_FOLDER } from './constants';

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

app.post('/process-files', <any>upload.any(), handleFileUpload);

app.post('/submit-ad', <any>upload.single('adFile'), (req, res) =>
  handleAdSubmission(req, res)
);

app.post('/update-ad', <any>upload.single('adFile'), (req, res) =>
  handleAdSubmission(req, res)
);

app.post('/delete-ad', handleAdDelete);

app.get(`/${R2_COMICS_FOLDER}/:comicId/:pageToken`, serveComicPageFile);
app.get(`/${R2_PROFILE_PHOTOS_FOLDER}/:token`, serveProfilePicFile);

// Just for now, error logging for dev
app.post('/error-log', handleErrorLog);
app.get('/error-log', serveErrorLogs);
app.get('/clear-error-logs', clearLogs);

// These are PURELY relevant for local dev
app.post('/local-dev-manage-files', handleLocalDevManageFiles);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Local dev: ${process.env.LOCAL_DEV}`);
});
