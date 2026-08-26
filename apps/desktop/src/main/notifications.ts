import { Notification, nativeImage, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { showAndFocusWindow } from './window';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
}

export async function showNotification(options: NotificationOptions): Promise<boolean> {
  if (!Notification.isSupported()) {
    console.warn('[Notifications] Native notifications are not supported on this platform/session.');
    return false;
  }

  try {
    const defaultIconPath = path.join(__dirname, '../../build/icon.png');
    const appDefaultIconPath = path.join(app.getAppPath(), 'build/icon.png');
    let notificationIcon: Electron.NativeImage | undefined;

    if (options.icon && fs.existsSync(options.icon)) {
      notificationIcon = nativeImage.createFromPath(options.icon);
    } else if (fs.existsSync(defaultIconPath)) {
      notificationIcon = nativeImage.createFromPath(defaultIconPath);
    } else if (fs.existsSync(appDefaultIconPath)) {
      notificationIcon = nativeImage.createFromPath(appDefaultIconPath);
    }

    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: notificationIcon,
      silent: options.silent ?? false,
    });

    notification.on('click', () => {
      showAndFocusWindow();
    });

    notification.show();
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to display notification:', error);
    return false;
  }
}
