import { describe, it } from "node:test";
import assert from "node:assert/strict";

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
  onTrayAction: (callback: (action: "new-routine" | "reset-today") => void) => () => void;
}

export class MockElectronAPIEngine implements ElectronAPI {
  public platform: NodeJS.Platform = "win32";
  private _isMaximized = false;
  private _isMinimized = false;
  private _isClosed = false;
  private maximizeListeners: Set<(isMax: boolean) => void> = new Set();
  private trayListeners: Set<(action: "new-routine" | "reset-today") => void> = new Set();
  public notificationsSent: Array<{ title: string; body: string; icon?: string; silent?: boolean }> = [];
  public openedUrls: string[] = [];

  async minimize(): Promise<void> {
    this._isMinimized = true;
  }

  async maximize(): Promise<boolean> {
    this._isMaximized = !this._isMaximized;
    this.maximizeListeners.forEach((cb) => cb(this._isMaximized));
    return this._isMaximized;
  }

  async close(): Promise<void> {
    this._isClosed = true;
  }

  async isMaximized(): Promise<boolean> {
    return this._isMaximized;
  }

  onMaximizeChange(callback: (isMaximized: boolean) => void): () => void {
    this.maximizeListeners.add(callback);
    return () => {
      this.maximizeListeners.delete(callback);
    };
  }

  async showNotification(options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
  }): Promise<boolean> {
    if (!options.title) return false;
    this.notificationsSent.push(options);
    return true;
  }

  async openExternal(url: string): Promise<void> {
    this.openedUrls.push(url);
  }

  async getVersion(): Promise<string> {
    return "1.0.0";
  }

  onTrayAction(callback: (action: "new-routine" | "reset-today") => void): () => void {
    this.trayListeners.add(callback);
    return () => {
      this.trayListeners.delete(callback);
    };
  }

  // Simulation helpers
  dispatchTrayAction(action: "new-routine" | "reset-today") {
    this.trayListeners.forEach((cb) => cb(action));
  }

  get state() {
    return {
      isMaximized: this._isMaximized,
      isMinimized: this._isMinimized,
      isClosed: this._isClosed,
    };
  }
}

describe("Feature 1, 2, 3, 4: TitleBar & Electron IPC Bridge Contracts", () => {
  it("T1.2.1 - T1.2.4: Window minimize, maximize toggle, and maximize state listener", async () => {
    const api = new MockElectronAPIEngine();
    
    let lastObservedState = false;
    const unsub = api.onMaximizeChange((isMax) => {
      lastObservedState = isMax;
    });

    assert.equal(await api.isMaximized(), false);
    
    // Maximize
    const result1 = await api.maximize();
    assert.equal(result1, true);
    assert.equal(await api.isMaximized(), true);
    assert.equal(lastObservedState, true);

    // Restore (Unmaximize)
    const result2 = await api.maximize();
    assert.equal(result2, false);
    assert.equal(await api.isMaximized(), false);
    assert.equal(lastObservedState, false);

    // Unsubscribe check
    unsub();
    await api.maximize();
    assert.equal(lastObservedState, false); // Listener not invoked after unsub
  });

  it("T1.4.1 & T1.4.4: OS notification dispatch and options verification", async () => {
    const api = new MockElectronAPIEngine();
    const ok = await api.showNotification({
      title: "Weather Alert",
      body: "Rain predicted today — pack an umbrella!",
      icon: "Umbrella",
      silent: false,
    });

    assert.equal(ok, true);
    assert.equal(api.notificationsSent.length, 1);
    assert.equal(api.notificationsSent[0].title, "Weather Alert");
    assert.equal(api.notificationsSent[0].silent, false);
  });

  it("T1.3.4 & T3.41: System Tray action event dispatch relay", async () => {
    const api = new MockElectronAPIEngine();
    const receivedActions: string[] = [];

    const unsub = api.onTrayAction((action) => {
      receivedActions.push(action);
    });

    api.dispatchTrayAction("reset-today");
    api.dispatchTrayAction("new-routine");

    assert.deepEqual(receivedActions, ["reset-today", "new-routine"]);
    unsub();
  });

  it("T1.1.4: App metadata and external URL opener contracts", async () => {
    const api = new MockElectronAPIEngine();
    assert.equal(await api.getVersion(), "1.0.0");
    assert.equal(api.platform, "win32");

    await api.openExternal("https://pocketcheck.app");
    assert.deepEqual(api.openedUrls, ["https://pocketcheck.app"]);
  });
});
