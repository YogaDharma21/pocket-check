import { ipcMain, shell, app, BrowserWindow } from 'electron';
import { showNotification, NotificationOptions } from './notifications';
import { getMainWindow } from './window';

export function registerIpcHandlers(defaultWindow: BrowserWindow): void {
  const getTargetWindow = (event: Electron.IpcMainInvokeEvent): BrowserWindow | null => {
    return BrowserWindow.fromWebContents(event.sender) || defaultWindow || getMainWindow();
  };

  // Window controls
  ipcMain.handle('window:minimize', (event) => {
    const win = getTargetWindow(event);
    win?.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    const win = getTargetWindow(event);
    if (!win) return false;
    if (win.isMaximized()) {
      win.unmaximize();
      return false;
    } else {
      win.maximize();
      return true;
    }
  });

  ipcMain.handle('window:close', (event) => {
    const win = getTargetWindow(event);
    win?.close();
  });

  ipcMain.handle('window:is-maximized', (event) => {
    const win = getTargetWindow(event);
    return win ? win.isMaximized() : false;
  });

  // Native Notifications
  ipcMain.handle('notification:show', async (_event, options: NotificationOptions) => {
    return await showNotification(options);
  });

  // Shell & External links
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:'))) {
      await shell.openExternal(url);
    }
  });

  // App Metadata & Platform
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });
}
