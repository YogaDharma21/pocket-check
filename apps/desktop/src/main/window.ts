import { BrowserWindow, shell, nativeImage, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

export function getIsQuitting(): boolean {
  return isQuitting;
}

export function setIsQuitting(val: boolean): void {
  isQuitting = val;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function showAndFocusWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createWindow();
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
  mainWindow.focus();
}

export function toggleWindowVisibility(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    showAndFocusWindow();
    return;
  }
  if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
    mainWindow.hide();
  } else {
    showAndFocusWindow();
  }
}

export function createWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  const iconPath = path.join(__dirname, '../../build/icon.png');
  const appIconPath = path.join(app.getAppPath(), 'build/icon.png');
  const resolvedIconPath = fs.existsSync(iconPath)
    ? iconPath
    : fs.existsSync(appIconPath)
      ? appIconPath
      : '';
  const icon = resolvedIconPath ? nativeImage.createFromPath(resolvedIconPath) : undefined;

  let preloadPath = path.join(__dirname, '../preload/index.mjs');
  if (!fs.existsSync(preloadPath)) {
    preloadPath = path.join(__dirname, '../preload/index.js');
  }
  if (!fs.existsSync(preloadPath)) {
    preloadPath = path.join(app.getAppPath(), 'dist-electron/preload/index.mjs');
  }

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#09090b', // Matches dark mode zinc-950 to prevent launch flash
    show: false,
    icon,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });

  // Sanitize userAgent to remove Electron identifiers so Google OAuth works seamlessly in Electron
  const cleanUserAgent = mainWindow.webContents.userAgent
    .replace(/Electron\/\S+\s?/g, '')
    .replace(/pocket-check\/\S+\s?/gi, '')
    .replace(/desktop\/\S+\s?/gi, '');
  mainWindow.webContents.setUserAgent(cleanUserAgent);

  // Ready-to-show visual smoothing
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Maximize / Unmaximize event broadcasting to renderer
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximize-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximize-change', false);
  });

  // Intercept window close for minimize-to-tray functionality
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Strict link opening security - Always open external web links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isLocalApp =
      url.startsWith('http://localhost:5173') ||
      url.startsWith('http://127.0.0.1:5173') ||
      url.startsWith('file://');

    if (!isLocalApp) {
      event.preventDefault();
      if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:')) {
        shell.openExternal(url);
      }
    }
  });

  // URL / File Loading
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    const htmlPath = path.resolve(__dirname, '../../dist/index.html');
    const fallbackHtmlPath = path.join(app.getAppPath(), 'dist/index.html');
    if (fs.existsSync(htmlPath)) {
      mainWindow.loadFile(htmlPath);
    } else if (fs.existsSync(fallbackHtmlPath)) {
      mainWindow.loadFile(fallbackHtmlPath);
    } else {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
  }

  return mainWindow;
}
