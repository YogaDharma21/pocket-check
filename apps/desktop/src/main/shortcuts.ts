import { globalShortcut, BrowserWindow } from 'electron';
import { toggleWindowVisibility } from './window';

export function registerShortcuts(_window: BrowserWindow): void {
  // Global hotkey: CommandOrControl+Shift+P to toggle show/hide
  try {
    const ret = globalShortcut.register('CommandOrControl+Shift+P', () => {
      toggleWindowVisibility();
    });

    if (!ret) {
      console.warn('[Shortcuts] Registration failed for CommandOrControl+Shift+P');
    }
  } catch (err) {
    console.error('[Shortcuts] Error registering global shortcuts:', err);
  }
}

export function unregisterShortcuts(): void {
  try {
    globalShortcut.unregisterAll();
  } catch (err) {
    console.error('[Shortcuts] Error unregistering global shortcuts:', err);
  }
}
