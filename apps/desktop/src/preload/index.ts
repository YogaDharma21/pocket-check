import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<boolean>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void;
  showNotification: (options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
  }) => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
  getVersion: () => Promise<string>;
  platform: NodeJS.Platform;
  onTrayAction: (callback: (action: 'new-routine' | 'reset-today') => void) => () => void;
}

const electronAPI: ElectronAPI = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    const listener = (_event: IpcRendererEvent, isMaximized: boolean) => {
      callback(isMaximized);
    };
    ipcRenderer.on('window:maximize-change', listener);
    return () => {
      ipcRenderer.removeListener('window:maximize-change', listener);
    };
  },

  showNotification: (options) => ipcRenderer.invoke('notification:show', options),

  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),

  getVersion: () => ipcRenderer.invoke('app:get-version'),

  platform: process.platform,

  onTrayAction: (callback: (action: 'new-routine' | 'reset-today') => void) => {
    const listener = (_event: IpcRendererEvent, action: 'new-routine' | 'reset-today') => {
      callback(action);
    };
    ipcRenderer.on('tray:action', listener);
    return () => {
      ipcRenderer.removeListener('tray:action', listener);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
