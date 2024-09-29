import { Request, Response } from 'express';
import { localErrorLogFilePath } from '../utils';
import { readFileSync, writeFileSync } from 'fs';

type ApiLogError = {
  logMessage: string;
  context?: any;
  dbQueries?: any;
  timestamp?: string;
  errorJSONStr?: string;
};

export async function handleErrorLog(req: Request, res: Response) {
  if (!req.body) {
    return res.status(400).send('No logs were sent.');
  }

  const error = req.body.error as ApiLogError;
  console.log('Received error log:', error);

  const logs = readFileSync(localErrorLogFilePath, 'utf-8');
  const logsArray = JSON.parse(logs);

  error.timestamp = new Date().toISOString();

  logsArray.unshift(error);

  writeFileSync(localErrorLogFilePath, JSON.stringify(logsArray, null, 2));

  console.log('Logs received');
  return res.status(200).send('Logs received');
}

export async function serveErrorLogs(req: Request, res: Response) {
  const logs = readFileSync(localErrorLogFilePath, 'utf-8');

  const parsed = JSON.parse(logs);

  const sliced = parsed.slice(-50);

  return res.status(200).send(sliced);
}
