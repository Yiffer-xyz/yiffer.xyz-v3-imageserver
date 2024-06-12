import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, Router } from 'express';
import { handleUpload } from './comic-upload';
import multer from 'multer';
import cors from 'cors';

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
