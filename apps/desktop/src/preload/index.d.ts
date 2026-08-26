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

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
