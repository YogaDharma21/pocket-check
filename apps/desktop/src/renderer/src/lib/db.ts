/**
 * In-Memory & LocalStorage Database Store simulating Convex backend behavior
 * Enables 100% offline standalone operation for PocketCheck Desktop.
 */

import { SMART_PRESETS } from "./presets";

export interface Item {
  _id: string;
  userId: string;
  routine: string;
  name: string;
  isPacked: boolean;
  isDefault?: boolean;
  emoji?: string;
  quantity?: number;
  locationNote?: string;
  order?: number;
}

export interface Routine {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  autoResetTime?: string;
  autoResetDays?: number[];
  lastResetDate?: string;
  order?: number;
}

type Listener = () => void;

export class InMemoryConvexDB {
  private items: Map<string, Item> = new Map();
  private routines: Map<string, Routine> = new Map();
  private idCounter = 1;
  private listeners: Set<Listener> = new Set();
  private storageKeyPrefix: string;

  constructor(storageKeyPrefix: string = "pocketcheck") {
    this.storageKeyPrefix = storageKeyPrefix;
    this.loadFromStorage();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error("Error in DB subscriber listener:", err);
      }
    });
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      const storedRoutines = localStorage.getItem(`${this.storageKeyPrefix}_routines`);
      const storedItems = localStorage.getItem(`${this.storageKeyPrefix}_items`);

      if (storedRoutines && storedItems) {
        const routinesArr: Routine[] = JSON.parse(storedRoutines);
        const itemsArr: Item[] = JSON.parse(storedItems);

        routinesArr.forEach((r) => this.routines.set(r._id, r));
        itemsArr.forEach((i) => this.items.set(i._id, i));
        this.idCounter = Math.max(
          1,
          ...routinesArr.map((r) => parseInt(r._id.split("_")[1] || "0", 10) + 1),
          ...itemsArr.map((i) => parseInt(i._id.split("_")[1] || "0", 10) + 1)
        );
      } else {
        // Seed default presets
        this.seedDefaults("local_desktop_user");
      }
    } catch (e) {
      console.warn("Failed to load DB from localStorage:", e);
      this.seedDefaults("local_desktop_user");
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const routinesArr = Array.from(this.routines.values());
      const itemsArr = Array.from(this.items.values());

      localStorage.setItem(`${this.storageKeyPrefix}_routines`, JSON.stringify(routinesArr));
      localStorage.setItem(`${this.storageKeyPrefix}_items`, JSON.stringify(itemsArr));
    } catch (e) {
      console.warn("Failed to save DB to localStorage:", e);
    }
  }

  private seedDefaults(userId: string): void {
    this.routines.clear();
    this.items.clear();

    SMART_PRESETS.forEach((preset, pIdx) => {
      const routineId = `routines_${this.idCounter++}`;
      this.routines.set(routineId, {
        _id: routineId,
        userId,
        name: preset.name,
        icon: preset.icon,
        order: pIdx,
      });

      preset.items.forEach((item, iIdx) => {
        const itemId = `items_${this.idCounter++}`;
        this.items.set(itemId, {
          _id: itemId,
          userId,
          routine: preset.name,
          name: item.name,
          emoji: item.emoji,
          isPacked: false,
          order: iIdx,
        });
      });
    });

    this.saveToStorage();
  }

  private generateId(table: string): string {
    return `${table}_${this.idCounter++}`;
  }

  // --- Routines Queries & Mutations ---

  async listRoutines(userId: string): Promise<Routine[]> {
    const userRoutines = Array.from(this.routines.values()).filter(
      (r) => r.userId === userId
    );
    return userRoutines.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async addRoutine(
    userId: string,
    args: {
      name: string;
      icon: string;
      autoResetTime?: string;
      autoResetDays?: number[];
    }
  ): Promise<string> {
    const existing = Array.from(this.routines.values()).find(
      (r) => r.userId === userId && r.name.toLowerCase() === args.name.toLowerCase()
    );
    if (existing) return existing._id;

    const userRoutines = await this.listRoutines(userId);
    const maxOrder = userRoutines.reduce((m, r) => Math.max(m, r.order ?? 0), -1);

    const _id = this.generateId("routines");
    const routine: Routine = {
      _id,
      userId,
      name: args.name,
      icon: args.icon,
      order: maxOrder + 1,
      autoResetTime: args.autoResetTime,
      autoResetDays: args.autoResetDays,
    };
    this.routines.set(_id, routine);
    this.notify();
    return _id;
  }

  async updateRoutine(
    userId: string,
    args: {
      id: string;
      name: string;
      icon: string;
      autoResetTime?: string;
      autoResetDays?: number[];
    }
  ): Promise<void> {
    const routine = this.routines.get(args.id);
    if (!routine || routine.userId !== userId) throw new Error("Not found");

    const oldName = routine.name;
    if (oldName !== args.name) {
      // Cascading item routine rename
      for (const item of this.items.values()) {
        if (item.userId === userId && item.routine === oldName) {
          item.routine = args.name;
        }
      }
    }

    routine.name = args.name;
    routine.icon = args.icon;
    routine.autoResetTime = args.autoResetTime;
    routine.autoResetDays = args.autoResetDays;
    this.notify();
  }

  async deleteRoutine(userId: string, id: string): Promise<void> {
    const routine = this.routines.get(id);
    if (!routine || routine.userId !== userId) throw new Error("Not found");

    // Cascading item deletion
    for (const [itemId, item] of this.items.entries()) {
      if (item.userId === userId && item.routine === routine.name) {
        this.items.delete(itemId);
      }
    }
    this.routines.delete(id);
    this.notify();
  }

  async reorderRoutines(userId: string, ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      const routine = this.routines.get(ids[i]);
      if (routine && routine.userId === userId) {
        routine.order = i;
      }
    }
    this.notify();
  }

  // --- Items Queries & Mutations ---

  async listItems(userId: string, routine: string): Promise<Item[]> {
    const routineItems = Array.from(this.items.values()).filter(
      (i) => i.userId === userId && i.routine === routine
    );
    return routineItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async addItem(
    userId: string,
    args: {
      routine: string;
      name: string;
      emoji?: string;
      quantity?: number;
      locationNote?: string;
    }
  ): Promise<string> {
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Item name cannot be empty");

    const routineItems = await this.listItems(userId, args.routine);
    const maxOrder = routineItems.reduce((m, i) => Math.max(m, i.order ?? 0), -1);

    const _id = this.generateId("items");
    const item: Item = {
      _id,
      userId,
      routine: args.routine,
      name: trimmed,
      isPacked: false,
      order: maxOrder + 1,
      emoji: args.emoji,
      quantity: args.quantity && args.quantity > 1 ? args.quantity : undefined,
      locationNote: args.locationNote,
    };
    this.items.set(_id, item);
    this.notify();
    return _id;
  }

  async editItem(
    userId: string,
    args: {
      id: string;
      name: string;
      emoji?: string;
      quantity?: number;
      locationNote?: string;
    }
  ): Promise<void> {
    const item = this.items.get(args.id);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    item.name = args.name.trim();
    item.emoji = args.emoji;
    item.quantity = args.quantity && args.quantity > 1 ? args.quantity : undefined;
    item.locationNote = args.locationNote;
    this.notify();
  }

  async toggleItem(userId: string, id: string, isPacked: boolean): Promise<void> {
    const item = this.items.get(id);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    item.isPacked = isPacked;
    this.notify();
  }

  async deleteItem(userId: string, id: string): Promise<Item> {
    const item = this.items.get(id);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    this.items.delete(id);
    this.notify();
    return item;
  }

  async resetItems(userId: string, routine: string): Promise<void> {
    for (const item of this.items.values()) {
      if (item.userId === userId && item.routine === routine) {
        item.isPacked = false;
      }
    }
    this.notify();
  }

  async deleteAllItems(userId: string, routine: string): Promise<Item[]> {
    const deleted: Item[] = [];
    for (const [id, item] of this.items.entries()) {
      if (item.userId === userId && item.routine === routine) {
        deleted.push(item);
        this.items.delete(id);
      }
    }
    this.notify();
    return deleted;
  }

  async restoreItems(userId: string, itemsToRestore: Array<Omit<Item, "_id" | "userId">>): Promise<string[]> {
    const restoredIds: string[] = [];
    for (const itemData of itemsToRestore) {
      const _id = this.generateId("items");
      const item: Item = {
        _id,
        userId,
        ...itemData,
      };
      this.items.set(_id, item);
      restoredIds.push(_id);
    }
    this.notify();
    return restoredIds;
  }

  async resetAllRoutines(userId: string): Promise<void> {
    for (const item of this.items.values()) {
      if (item.userId === userId) {
        item.isPacked = false;
      }
    }
    this.notify();
  }

  async checkAndExecuteAutoReset(
    userId: string,
    args: { routineId: string; currentDateStr: string }
  ): Promise<{ reset: boolean; routineName?: string }> {
    const routine = this.routines.get(args.routineId);
    if (!routine || routine.userId !== userId) return { reset: false };

    if (routine.lastResetDate === args.currentDateStr) {
      return { reset: false };
    }

    await this.resetItems(userId, routine.name);
    routine.lastResetDate = args.currentDateStr;
    this.notify();
    return { reset: true, routineName: routine.name };
  }

  async reorderItems(userId: string, ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      const item = this.items.get(ids[i]);
      if (item && item.userId === userId) {
        item.order = i;
      }
    }
    this.notify();
  }

  async addItemsBatch(
    userId: string,
    routine: string,
    itemsList: Array<{ name: string; emoji?: string; quantity?: number; locationNote?: string }>
  ): Promise<string[]> {
    const insertedIds: string[] = [];
    const routineItems = await this.listItems(userId, routine);
    let currentOrder = routineItems.reduce((m, i) => Math.max(m, i.order ?? 0), -1);

    for (const item of itemsList) {
      const trimmed = item.name?.trim();
      if (!trimmed) continue;
      currentOrder += 1;
      const _id = this.generateId("items");
      this.items.set(_id, {
        _id,
        userId,
        routine,
        name: trimmed,
        isPacked: false,
        order: currentOrder,
        emoji: item.emoji,
        quantity: item.quantity && item.quantity > 1 ? item.quantity : undefined,
        locationNote: item.locationNote,
      });
      insertedIds.push(_id);
    }
    this.notify();
    return insertedIds;
  }

  async applyPreset(
    userId: string,
    args: {
      name: string;
      icon: string;
      items: Array<{ name: string; emoji?: string; quantity?: number; locationNote?: string }>;
      targetRoutine?: string;
    }
  ): Promise<{ routineName: string; insertedIds: string[] }> {
    const routineName = args.targetRoutine?.trim() || args.name.trim();
    let existingRoutine = (await this.listRoutines(userId)).find(
      (r) => r.name.toLowerCase() === routineName.toLowerCase()
    );

    if (!existingRoutine) {
      const routineId = await this.addRoutine(userId, { name: routineName, icon: args.icon || "tag" });
      existingRoutine = this.routines.get(routineId)!;
    }

    const existingItems = await this.listItems(userId, existingRoutine.name);
    const existingNames = new Set(existingItems.map((i) => i.name.toLowerCase().trim()));

    const itemsToAdd = args.items.filter(
      (item) => item.name && !existingNames.has(item.name.toLowerCase().trim())
    );

    const insertedIds = await this.addItemsBatch(userId, existingRoutine.name, itemsToAdd);
    this.notify();
    return { routineName: existingRoutine.name, insertedIds };
  }
}
