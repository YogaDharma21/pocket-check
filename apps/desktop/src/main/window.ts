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
  mainWindow.setAlwaysOnTop(true);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.flashFrame(true);
  mainWindow.setAlwaysOnTop(false);
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

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

function getWindowStateFile(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState(): WindowState {
  const defaultState: WindowState = {
    width: 1100,
    height: 750,
    isMaximized: false,
  };

  try {
    const filePath = getWindowStateFile();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (typeof data.width === 'number' && typeof data.height === 'number') {
        return {
          x: typeof data.x === 'number' ? data.x : undefined,
          y: typeof data.y === 'number' ? data.y : undefined,
          width: Math.max(data.width, 800),
          height: Math.max(data.height, 600),
          isMaximized: Boolean(data.isMaximized),
        };
      }
    }
  } catch {
    // Ignore read or parse errors
  }
  return defaultState;
}

function saveWindowState(window: BrowserWindow): void {
  try {
    const isMaximized = window.isMaximized();
    let bounds = window.getNormalBounds();
    if (!isMaximized) {
      bounds = window.getBounds();
    }
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    };
    fs.writeFileSync(getWindowStateFile(), JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Ignore write errors
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

  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#08090b', // Matches dark mode canvas to prevent launch flash
    show: false,
    icon,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

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

  let saveTimer: NodeJS.Timeout | null = null;
  const debouncedSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        saveWindowState(mainWindow);
      }
    }, 300);
  };

  mainWindow.on('resize', debouncedSave);
  mainWindow.on('move', debouncedSave);

  // Maximize / Unmaximize event broadcasting to renderer
  mainWindow.on('maximize', () => {
    debouncedSave();
    mainWindow?.webContents.send('window:maximize-change', true);
  });

  mainWindow.on('unmaximize', () => {
    debouncedSave();
    mainWindow?.webContents.send('window:maximize-change', false);
  });

  // Intercept window close for minimize-to-tray functionality
  mainWindow.on('close', (event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState(mainWindow);
    }
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
      // Prevent internal webview redirects (e.g. from Clerk auth) from opening unwanted browser tabs.
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
