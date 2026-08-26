import { app, BrowserWindow } from 'electron';
import path from 'path';
import { createWindow, getMainWindow, getIsQuitting, setIsQuitting, showAndFocusWindow } from './window';
import { createTray, destroyTray } from './tray';
import { registerIpcHandlers } from './ipc';
import { registerShortcuts, unregisterShortcuts } from './shortcuts';
import { startAuthServer, stopAuthServer } from './authServer';

// Set Windows AppUserModelId for native toast notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('com.pocketcheck.desktop');
}

// Register custom protocol client for deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('pocketcheck', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('pocketcheck');
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      showAndFocusWindow();
      const deepLink = commandLine.find((arg) => arg.startsWith('pocketcheck://'));
      if (deepLink) {
        mainWindow.webContents.send('auth:sso-callback', deepLink);
      }
    }
  });

  app.on('open-url', (_event, url) => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      showAndFocusWindow();
      mainWindow.webContents.send('auth:sso-callback', url);
    }
  });

  app.whenReady().then(() => {
    // 1. Create main window
    const mainWindow = createWindow();

    // 2. Register IPC handlers
    registerIpcHandlers(mainWindow);

    // 3. Start local auth loopback server for Google OAuth redirect
    startAuthServer(mainWindow);

    // 4. Initialize system tray
    createTray(mainWindow);

    // 5. Register global keyboard shortcuts
    registerShortcuts(mainWindow);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        showAndFocusWindow();
      }
    });
  });

  app.on('before-quit', () => {
    setIsQuitting(true);
  });

  app.on('will-quit', () => {
    stopAuthServer();
    unregisterShortcuts();
    destroyTray();
  });

  app.on('window-all-closed', () => {
    // If not quitting and tray is active, keep running in background
    if (getIsQuitting() || process.platform === 'darwin') {
      // Allow standard lifecycle
    }
  });
}
