import { app, BrowserWindow } from 'electron';
import { createWindow, getMainWindow, getIsQuitting, setIsQuitting, showAndFocusWindow } from './window';
import { createTray, destroyTray } from './tray';
import { registerIpcHandlers } from './ipc';
import { registerShortcuts, unregisterShortcuts } from './shortcuts';

// Set Windows AppUserModelId for native toast notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('com.pocketcheck.desktop');
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      showAndFocusWindow();
    }
  });

  app.whenReady().then(() => {
    // 1. Create main window
    const mainWindow = createWindow();

    // 2. Register IPC handlers
    registerIpcHandlers(mainWindow);

    // 3. Initialize system tray
    createTray(mainWindow);

    // 4. Register global keyboard shortcuts
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
