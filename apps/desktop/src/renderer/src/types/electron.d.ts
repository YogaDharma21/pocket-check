export interface ElectronAPI {
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<boolean>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void;

  // Native Notifications
  showNotification: (options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
  }) => Promise<boolean>;

  // Shell & External links
  openExternal: (url: string) => Promise<void>;

  // App Metadata & Platform
  getVersion: () => Promise<string>;
  platform: NodeJS.Platform | string;

  // Tray events
  onTrayAction: (callback: (action: "new-routine" | "reset-today") => void) => () => void;

  // Auth loopback server
  getAuthPort: () => Promise<number>;
  onAuthCallback: (callback: (url: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
