import dotenv from 'dotenv';
dotenv.config();

import './comic-upload/local-page-saver';
import express, { Request, Response, Router } from 'express';
import { handleUpload } from './comic-upload/comic-upload';
import multer from 'multer';
import cors from 'cors';
import { serveFile } from './local-file-serve/serve-file';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
const port = 8770;

app.use(express.json());
app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Yiffer Images Server!');
});

app.post(
  '/comic-upload',
  upload.fields([{ name: 'pages' }, { name: 'thumbnail', maxCount: 1 }]),
  handleUpload
);

app.get('/:comicName/:fileName', serveFile);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
