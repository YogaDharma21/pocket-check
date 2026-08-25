import { describe, it } from "node:test";
import assert from "node:assert/strict";

// In-Memory Database Store simulating Convex backend behavior
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

export class InMemoryConvexDB {
  private items: Map<string, Item> = new Map();
  private routines: Map<string, Routine> = new Map();
  private idCounter = 1;

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
  }

  async reorderRoutines(userId: string, ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      const routine = this.routines.get(ids[i]);
      if (routine && routine.userId === userId) {
        routine.order = i;
      }
    }
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
  }

  async toggleItem(userId: string, id: string, isPacked: boolean): Promise<void> {
    const item = this.items.get(id);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    item.isPacked = isPacked;
  }

  async deleteItem(userId: string, id: string): Promise<Item> {
    const item = this.items.get(id);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    this.items.delete(id);
    return item;
  }

  async resetItems(userId: string, routine: string): Promise<void> {
    for (const item of this.items.values()) {
      if (item.userId === userId && item.routine === routine) {
        item.isPacked = false;
      }
    }
  }

  async deleteAllItems(userId: string, routine: string): Promise<Item[]> {
    const deleted: Item[] = [];
    for (const [id, item] of this.items.entries()) {
      if (item.userId === userId && item.routine === routine) {
        deleted.push(item);
        this.items.delete(id);
      }
    }
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
    return restoredIds;
  }

  async resetAllRoutines(userId: string): Promise<void> {
    for (const item of this.items.values()) {
      if (item.userId === userId) {
        item.isPacked = false;
      }
    }
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
    return { reset: true, routineName: routine.name };
  }

  async reorderItems(userId: string, ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      const item = this.items.get(ids[i]);
      if (item && item.userId === userId) {
        item.order = i;
      }
    }
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
    return { routineName: existingRoutine.name, insertedIds };
  }
}

describe("Feature 8 & 9 & Data Layer: CRUD Mutations and Queries Simulation", () => {
  const USER_A = "user_123";
  const USER_B = "user_456";

  it("T1.8.1: addRoutine creates a new routine with sequential order", async () => {
    const db = new InMemoryConvexDB();
    const id1 = await db.addRoutine(USER_A, { name: "Kampus", icon: "GraduationCap" });
    const id2 = await db.addRoutine(USER_A, { name: "Work", icon: "Briefcase" });

    const routines = await db.listRoutines(USER_A);
    assert.equal(routines.length, 2);
    assert.equal(routines[0]._id, id1);
    assert.equal(routines[0].order, 0);
    assert.equal(routines[1]._id, id2);
    assert.equal(routines[1].order, 1);
  });

  it("T1.8.2: addRoutine duplicate check returns existing routine ID", async () => {
    const db = new InMemoryConvexDB();
    const id1 = await db.addRoutine(USER_A, { name: "Work", icon: "Briefcase" });
    const id2 = await db.addRoutine(USER_A, { name: "Work", icon: "Briefcase" });

    assert.equal(id1, id2);
    const routines = await db.listRoutines(USER_A);
    assert.equal(routines.length, 1);
  });

  it("T1.8.3: updateRoutine updates metadata and cascadingly renames item routine field", async () => {
    const db = new InMemoryConvexDB();
    const routineId = await db.addRoutine(USER_A, { name: "Old Work", icon: "Briefcase" });
    await db.addItem(USER_A, { routine: "Old Work", name: "Laptop" });
    await db.addItem(USER_A, { routine: "Old Work", name: "Charger" });

    await db.updateRoutine(USER_A, { id: routineId, name: "New Office", icon: "Building" });

    const updatedRoutines = await db.listRoutines(USER_A);
    assert.equal(updatedRoutines[0].name, "New Office");
    assert.equal(updatedRoutines[0].icon, "Building");

    const oldItems = await db.listItems(USER_A, "Old Work");
    assert.equal(oldItems.length, 0);

    const newItems = await db.listItems(USER_A, "New Office");
    assert.equal(newItems.length, 2);
    assert.equal(newItems[0].name, "Laptop");
  });

  it("T1.8.4: deleteRoutine cascadingly deletes all items belonging to that routine", async () => {
    const db = new InMemoryConvexDB();
    const r1 = await db.addRoutine(USER_A, { name: "Work", icon: "Briefcase" });
    const r2 = await db.addRoutine(USER_A, { name: "Travel", icon: "Plane" });

    await db.addItem(USER_A, { routine: "Work", name: "Laptop" });
    await db.addItem(USER_A, { routine: "Work", name: "Notebook" });
    await db.addItem(USER_A, { routine: "Travel", name: "Passport" });

    await db.deleteRoutine(USER_A, r1);

    const routines = await db.listRoutines(USER_A);
    assert.equal(routines.length, 1);
    assert.equal(routines[0].name, "Travel");

    const workItems = await db.listItems(USER_A, "Work");
    assert.equal(workItems.length, 0);

    const travelItems = await db.listItems(USER_A, "Travel");
    assert.equal(travelItems.length, 1);
  });

  it("T1.9.1 - T1.9.3: addItem, toggleItem, and editItem work accurately", async () => {
    const db = new InMemoryConvexDB();
    await db.addRoutine(USER_A, { name: "Daily", icon: "Calendar" });
    const itemId = await db.addItem(USER_A, {
      routine: "Daily",
      name: "Water Bottle",
      emoji: "CupSoda",
      quantity: 2,
      locationNote: "Side backpack pocket",
    });

    let items = await db.listItems(USER_A, "Daily");
    assert.equal(items[0].isPacked, false);
    assert.equal(items[0].quantity, 2);
    assert.equal(items[0].locationNote, "Side backpack pocket");

    await db.toggleItem(USER_A, itemId, true);
    items = await db.listItems(USER_A, "Daily");
    assert.equal(items[0].isPacked, true);

    await db.editItem(USER_A, {
      id: itemId,
      name: "Hydroflask 32oz",
      emoji: "CupSoda",
      quantity: 1, // Quantity 1 should normalize to undefined
      locationNote: "Desk",
    });

    items = await db.listItems(USER_A, "Daily");
    assert.equal(items[0].name, "Hydroflask 32oz");
    assert.equal(items[0].quantity, undefined);
    assert.equal(items[0].locationNote, "Desk");
  });

  it("T1.12.2: restoreItems correctly undoes deleted items", async () => {
    const db = new InMemoryConvexDB();
    await db.addRoutine(USER_A, { name: "Gym", icon: "Dumbbell" });
    const id1 = await db.addItem(USER_A, { routine: "Gym", name: "Towel" });
    const id2 = await db.addItem(USER_A, { routine: "Gym", name: "Shoes", isPacked: true });

    const deleted = await db.deleteAllItems(USER_A, "Gym");
    assert.equal(deleted.length, 2);
    assert.equal((await db.listItems(USER_A, "Gym")).length, 0);

    const restoredIds = await db.restoreItems(USER_A, deleted);
    assert.equal(restoredIds.length, 2);

    const restoredItems = await db.listItems(USER_A, "Gym");
    assert.equal(restoredItems.length, 2);
    assert.equal(restoredItems[0].name, "Towel");
    assert.equal(restoredItems[1].name, "Shoes");
  });

  it("T1.21.3: User data scoping isolates records between User A and User B", async () => {
    const db = new InMemoryConvexDB();
    await db.addRoutine(USER_A, { name: "UserA Routine", icon: "User" });
    await db.addItem(USER_A, { routine: "UserA Routine", name: "UserA Item" });

    await db.addRoutine(USER_B, { name: "UserB Routine", icon: "User" });
    await db.addItem(USER_B, { routine: "UserB Routine", name: "UserB Item" });

    const aRoutines = await db.listRoutines(USER_A);
    const bRoutines = await db.listRoutines(USER_B);
    assert.equal(aRoutines.length, 1);
    assert.equal(aRoutines[0].name, "UserA Routine");
    assert.equal(bRoutines.length, 1);
    assert.equal(bRoutines[0].name, "UserB Routine");

    const aItems = await db.listItems(USER_A, "UserA Routine");
    const bItems = await db.listItems(USER_B, "UserA Routine");
    assert.equal(aItems.length, 1);
    assert.equal(bItems.length, 0);
  });
});
