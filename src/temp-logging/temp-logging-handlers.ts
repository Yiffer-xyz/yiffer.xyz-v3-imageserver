import { Request, Response } from 'express';
import { localErrorLogFilePath } from '../utils';
import { readFileSync, writeFileSync } from 'fs';

type ApiLogError = {
  logMessage: string;
  context?: any;
  dbQueries?: any;
  timestamp: string;
  errorJSONStr?: string;
  sqlErrorShort?: string;
  isServerError?: boolean;
  isClientError?: boolean;
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

export async function clearLogs(req: Request, res: Response) {
  writeFileSync(localErrorLogFilePath, JSON.stringify([], null, 2));
  return res.status(200).send('Logs cleared');
}

// 🖐️ THIS IS AI GENERATED CODE, DO NOT JUDGE IT BY ITS QUALITY 🖐️
// It's just something ultra quick to see logs.
export async function serveErrorLogs(req: Request, res: Response) {
  const logs = readFileSync(localErrorLogFilePath, 'utf-8');
  const parsed = JSON.parse(logs);
  const sliced = parsed.slice(0, 100);

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error Logs</title>
      <style>
        /* CSS Reset */
        *, *::before, *::after {
          box-sizing: border-box;
        }
        body, h1, h2, h3, h4, p, figure, blockquote, dl, dd, div, span, pre {
          margin: 0;
          padding: 0;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.5;
          min-height: 100vh;
          padding: 20px;
        }
        /* Custom styles */
        h1 {
          margin-bottom: 0;
        }
        .log-entry {
          font-family: Consolas, monospace;
          margin-bottom: 20px;
          border: 1px solid #49ded7;
          padding: 10px;
          word-wrap: break-word;
        }
        .log-summary {
          display: flex;
          flex-direction: column;
          cursor: pointer;
        }
        .log-details {
          display: none;
          flex-direction: column;
          gap: 8px;
        }
        .log-details-item {
          font-size: 0.8em;
          white-space: pre-wrap;
          margin-top: 10px;
        }
        .expand-icon {
          font-size: 1.2em;
        }
        .bold {
        }
        .message-block {
          margin-bottom: 16px;
        }
        .time-ago {
          font-weight: bold;
        }
        .clear-logs-btn {
          background-color: #08ccc2;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        .clear-logs-btn:hover {
          background-color: #00b8ad;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <h1>Error Logs</h1>
        <button class="clear-logs-btn" onclick="clearLogs()">Clear Logs</button>
      </div>
      ${sliced
        .map(
          (log: ApiLogError) => `
        <div class="log-entry">
          <div class="log-summary" onclick="toggleDetails(this.parentElement)">
            <div>
              <span class="time-ago">${getTimeAgo(log.timestamp)}</span> (${new Date(log.timestamp).toLocaleString('nb-NO')})
            </div>
            ${log.isServerError ? '<span class="bold">Server error</span>' : ''}
            ${log.isClientError ? '<span class="bold">Client error</span>' : ''}
            <span class="bold">${log.logMessage}</span>
          </div>
          <div class="log-details">
            ${log.sqlErrorShort ? `<p class="log-details-item">SQL short: ${log.sqlErrorShort}</p>` : ''}
            ${log.context && Object.keys(log.context).length > 0 ? `<p class="log-details-item">Context: ${JSON.stringify(log.context, null, 2)}</p>` : ''}
            ${log.dbQueries ? `<p class="log-details-item">DB Queries: ${JSON.stringify(log.dbQueries, null, 2)}</p>` : ''}
            ${log.errorJSONStr ? `<p class="log-details-item">Error JSON: ${log.errorJSONStr.replace(/\\n/g, ' ')}</p>` : ''}
          </div>
        </div>
      `
        )
        .join('')}
      <script>
        function toggleDetails(element) {
          const details = element.querySelector('.log-details');
          if (details.style.display === 'none' || details.style.display === '') {
            details.style.display = 'flex';
          } else {
            details.style.display = 'none';
          }
        }

        function clearLogs() {
          if (confirm('Are you sure you want to clear all logs?')) {
            fetch('/clear-error-logs', { method: 'GET' })
              .then(response => {
                if (response.ok) {
                  alert('Logs cleared successfully');
                  location.reload();
                } else {
                  alert('Failed to clear logs');
                }
              })
              .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while clearing logs');
              });
          }
        }
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(htmlContent);
}
