import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setIsQuitting, showAndFocusWindow, toggleWindowVisibility } from './window';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;

export function sendTrayAction(window: BrowserWindow, action: 'new-routine' | 'reset-today'): void {
  showAndFocusWindow();
  window.webContents.send('tray:action', action);
}

export function createTray(window: BrowserWindow): Tray {
  const trayIconPath = path.join(__dirname, '../../build/tray-icon.png');
  const appTrayIconPath = path.join(app.getAppPath(), 'build/tray-icon.png');
  const mainIconPath = path.join(__dirname, '../../build/icon.png');
  const appMainIconPath = path.join(app.getAppPath(), 'build/icon.png');

  let icon: Electron.NativeImage;
  if (fs.existsSync(trayIconPath)) {
    icon = nativeImage.createFromPath(trayIconPath);
  } else if (fs.existsSync(appTrayIconPath)) {
    icon = nativeImage.createFromPath(appTrayIconPath);
  } else if (fs.existsSync(mainIconPath)) {
    icon = nativeImage.createFromPath(mainIconPath).resize({ width: 16, height: 16 });
  } else if (fs.existsSync(appMainIconPath)) {
    icon = nativeImage.createFromPath(appMainIconPath).resize({ width: 16, height: 16 });
  } else {
    icon = nativeImage.createEmpty();
  }

  // Support macOS template image for dark/light menubar
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true);
  }

  tray = new Tray(icon);
  tray.setToolTip('PocketCheck — Smart Routine Checklist');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show PocketCheck',
      click: () => {
        showAndFocusWindow();
      },
    },
    { type: 'separator' },
    {
      label: 'Quick Add Item',
      click: () => {
        sendTrayAction(window, 'new-routine');
      },
    },
    {
      label: "Reset Today's Checklist",
      click: () => {
        sendTrayAction(window, 'reset-today');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit PocketCheck',
      click: () => {
        setIsQuitting(true);
        window.close();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Left click on Windows/Linux toggles visibility
  tray.on('click', () => {
    toggleWindowVisibility();
  });

  return tray;
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
