import http from 'http';
import { BrowserWindow } from 'electron';
import { showAndFocusWindow } from './window';

let authServer: http.Server | null = null;
let currentPort = 49152;

const SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PocketCheck - Signed In</title>
  <style>
    body {
      background: #000000;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      box-sizing: border-box;
    }
    .card {
      text-align: center;
      padding: 40px 32px;
      background: #111113;
      border-radius: 28px;
      border: 1px solid #27272a;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      max-width: 380px;
      width: 100%;
    }
    .icon-box {
      width: 64px;
      height: 64px;
      background: #ffffff;
      color: #000000;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      font-size: 32px;
      font-weight: 900;
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    p {
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 20px 0;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box">&#10003;</div>
    <h1>Signed In Successfully</h1>
    <p>You have authenticated with Google. You can now close this browser tab and return to PocketCheck.</p>
    <div class="badge">PocketCheck Desktop</div>
  </div>
  <script>
    try {
      window.location.href = 'pocketcheck://auth-callback' + window.location.search;
    } catch (e) {}
  </script>
</body>
</html>`;

export function startAuthServer(mainWindow: BrowserWindow): Promise<number> {
  return new Promise((resolve) => {
    if (authServer) {
      resolve(currentPort);
      return;
    }

    const tryListen = (port: number) => {
      const server = http.createServer((req, res) => {
        const reqUrl = req.url || '';
        if (
          reqUrl.includes('/sso-callback') ||
          reqUrl.includes('/auth-callback') ||
          reqUrl.startsWith('/?')
        ) {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(SUCCESS_HTML);

          // Broadcast callback url to renderer
          const fullUrl = `http://127.0.0.1:${port}${reqUrl}`;
          mainWindow.webContents.send('auth:sso-callback', fullUrl);

          // Restore and focus the Electron main window
          showAndFocusWindow();
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      });

      server.on('error', () => {
        if (port < 49160) {
          tryListen(port + 1);
        } else {
          resolve(currentPort);
        }
      });

      server.listen(port, '127.0.0.1', () => {
        authServer = server;
        currentPort = port;
        resolve(port);
      });
    };

    tryListen(currentPort);
  });
}

export function stopAuthServer(): void {
  if (authServer) {
    authServer.close();
    authServer = null;
  }
}

export function getAuthPort(): number {
  return currentPort;
}
