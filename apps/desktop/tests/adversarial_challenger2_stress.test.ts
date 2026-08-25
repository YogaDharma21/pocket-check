import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ============================================================================
// DATA MODELS & IN-MEMORY REACTIVE CONVEX DB (Matching src/lib/db.ts)
// ============================================================================

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
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        // Listener errors should not break DB notifications
      }
    });
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

// ============================================================================
// HELPER FUNCTIONS & CODECS
// ============================================================================

export function validateResetTime(timeStr: string): boolean {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function evaluateAutoReset(
  routine: {
    autoResetTime?: string;
    autoResetDays?: number[];
    lastResetDate?: string;
  },
  currentTimeStr: string, // "HH:mm"
  currentDayOfWeek: number, // 0 = Sun, 1 = Mon, ..., 6 = Sat
  currentDateStr: string // "YYYY-MM-DD"
): boolean {
  if (!routine.autoResetTime || !validateResetTime(routine.autoResetTime)) return false;
  if (!routine.autoResetDays || routine.autoResetDays.length === 0) return false;

  // Already reset today -> skip
  if (routine.lastResetDate === currentDateStr) return false;

  // Active on current day?
  if (!routine.autoResetDays.includes(currentDayOfWeek)) return false;

  // Current time reached or passed reset time?
  const [resetH, resetM] = routine.autoResetTime.split(":").map(Number);
  const [curH, curM] = currentTimeStr.split(":").map(Number);

  const resetMinutes = resetH * 60 + resetM;
  const curMinutes = curH * 60 + curM;

  return curMinutes >= resetMinutes;
}

// Browser-compatible base64 encoding (simulating ShareRoutineModal.tsx)
export function browserEncodeSharePayload(payload: any): string {
  const json = JSON.stringify(payload);
  return encodeURIComponent(Buffer.from(json, "utf8").toString("base64"));
}

// Browser-compatible base64 decoding (simulating Dashboard.tsx)
export function browserDecodeSharePayload(importParam: string): any | null {
  if (!importParam || !importParam.trim()) return null;
  try {
    const decodedUri = decodeURIComponent(importParam);
    const json = Buffer.from(decodedUri, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.name === "string" && Array.isArray(parsed.items)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// Markdown export generator (simulating ExportModal.tsx)
export function generateMarkdownExport(
  routineName: string,
  items: Array<{ name: string; isPacked: boolean; emoji?: string; quantity?: number; locationNote?: string }>,
  dateStr: string = "2026-08-25"
): string {
  let md = `# PocketChecker — ${routineName} Checklist\n\n`;
  md += `*Exported on ${dateStr}*\n\n`;
  items.forEach((item) => {
    const check = item.isPacked ? "[x]" : "[ ]";
    const qty = item.quantity && item.quantity > 1 ? ` (${item.quantity}x)` : "";
    const note = item.locationNote ? ` — *${item.locationNote}*` : "";
    md += `- ${check} ${item.name}${qty}${note}\n`;
  });
  return md;
}

// JSON export generator (simulating ExportModal.tsx)
export function generateJSONExport(
  routineName: string,
  items: Array<{ name: string; isPacked: boolean; emoji?: string; quantity?: number; locationNote?: string }>,
  exportedAt: string = "2026-08-25T12:00:00.000Z"
): string {
  return JSON.stringify(
    {
      routine: routineName,
      exportedAt,
      items: items.map((i) => ({
        name: i.name,
        isPacked: i.isPacked,
        emoji: i.emoji,
        quantity: i.quantity,
        locationNote: i.locationNote,
      })),
    },
    null,
    2
  );
}

// ============================================================================
// ADVERSARIAL TEST SUITE
// ============================================================================

describe("CHALLENGER 2: Deep Empirical Stress Testing & Contract Verification", () => {
  // --------------------------------------------------------------------------
  // SUITE 1: Routine Auto-Reset Scheduler Evaluator Stress & Invariants
  // --------------------------------------------------------------------------
  describe("Suite 1: Auto-Reset Scheduler Evaluator Invariants & Edge Cases", () => {
    it("1.1 Time format validation boundaries (valid and invalid HH:mm formats)", () => {
      // Valid boundaries
      assert.equal(validateResetTime("00:00"), true);
      assert.equal(validateResetTime("00:01"), true);
      assert.equal(validateResetTime("05:59"), true);
      assert.equal(validateResetTime("12:00"), true);
      assert.equal(validateResetTime("12:01"), true);
      assert.equal(validateResetTime("23:58"), true);
      assert.equal(validateResetTime("23:59"), true);

      // Invalid boundaries & malformed
      assert.equal(validateResetTime("24:00"), false);
      assert.equal(validateResetTime("24:01"), false);
      assert.equal(validateResetTime("25:00"), false);
      assert.equal(validateResetTime("00:60"), false);
      assert.equal(validateResetTime("12:60"), false);
      assert.equal(validateResetTime("-01:00"), false);
      assert.equal(validateResetTime("06:0"), false);
      assert.equal(validateResetTime("6:00"), false);
      assert.equal(validateResetTime("6:0"), false);
      assert.equal(validateResetTime("12:34:56"), false);
      assert.equal(validateResetTime(""), false);
      assert.equal(validateResetTime("   "), false);
      assert.equal(validateResetTime("undefined"), false);
    });

    it("1.2 Time comparison progression (before, exact, after scheduled time)", () => {
      const routine = {
        autoResetTime: "07:30",
        autoResetDays: [1, 2, 3, 4, 5],
        lastResetDate: "2026-08-24",
      };

      // Tuesday (day 2), before reset time -> false
      assert.equal(evaluateAutoReset(routine, "07:29", 2, "2026-08-25"), false);
      assert.equal(evaluateAutoReset(routine, "00:00", 2, "2026-08-25"), false);
      assert.equal(evaluateAutoReset(routine, "06:45", 2, "2026-08-25"), false);

      // Tuesday (day 2), exact reset time -> true
      assert.equal(evaluateAutoReset(routine, "07:30", 2, "2026-08-25"), true);

      // Tuesday (day 2), after reset time -> true
      assert.equal(evaluateAutoReset(routine, "07:31", 2, "2026-08-25"), true);
      assert.equal(evaluateAutoReset(routine, "14:00", 2, "2026-08-25"), true);
      assert.equal(evaluateAutoReset(routine, "23:59", 2, "2026-08-25"), true);
    });

    it("1.3 7-day matrix evaluation (Mon=1 through Sun=0/7 active days)", () => {
      // Routine scheduled for Mon (1), Wed (3), Fri (5), Sun (0)
      const routine = {
        autoResetTime: "06:00",
        autoResetDays: [1, 3, 5, 0],
        lastResetDate: "2026-08-24",
      };

      // Active days at 06:00
      assert.equal(evaluateAutoReset(routine, "06:00", 1, "2026-08-25"), true); // Mon
      assert.equal(evaluateAutoReset(routine, "06:00", 3, "2026-08-25"), true); // Wed
      assert.equal(evaluateAutoReset(routine, "06:00", 5, "2026-08-25"), true); // Fri
      assert.equal(evaluateAutoReset(routine, "06:00", 0, "2026-08-25"), true); // Sun (0)

      // Inactive days at 06:00
      assert.equal(evaluateAutoReset(routine, "06:00", 2, "2026-08-25"), false); // Tue
      assert.equal(evaluateAutoReset(routine, "06:00", 4, "2026-08-25"), false); // Thu
      assert.equal(evaluateAutoReset(routine, "06:00", 6, "2026-08-25"), false); // Sat
    });

    it("1.4 Strict idempotency across multiple polls on same date", async () => {
      const db = new InMemoryConvexDB();
      const userId = "user_sched_test";
      const routineId = await db.addRoutine(userId, {
        name: "Morning Commute",
        icon: "Briefcase",
        autoResetTime: "06:00",
        autoResetDays: [1, 2, 3, 4, 5],
      });

      // Add packed items
      await db.addItem(userId, { routine: "Morning Commute", name: "Laptop" });
      await db.addItem(userId, { routine: "Morning Commute", name: "Keys" });
      const items = await db.listItems(userId, "Morning Commute");
      await db.toggleItem(userId, items[0]._id, true);
      await db.toggleItem(userId, items[1]._id, true);

      // Verify both items packed
      let currentItems = await db.listItems(userId, "Morning Commute");
      assert.equal(currentItems.filter((i) => i.isPacked).length, 2);

      // 1st Execution on 2026-08-25
      const res1 = await db.checkAndExecuteAutoReset(userId, {
        routineId,
        currentDateStr: "2026-08-25",
      });
      assert.equal(res1.reset, true);
      assert.equal(res1.routineName, "Morning Commute");

      // Items should now be unpacked
      currentItems = await db.listItems(userId, "Morning Commute");
      assert.equal(currentItems.filter((i) => i.isPacked).length, 0);

      // User re-packs 1 item later during the day
      await db.toggleItem(userId, items[0]._id, true);
      currentItems = await db.listItems(userId, "Morning Commute");
      assert.equal(currentItems.filter((i) => i.isPacked).length, 1);

      // Subsequent 50 polls on the same day MUST NOT reset again
      for (let i = 0; i < 50; i++) {
        const resPoll = await db.checkAndExecuteAutoReset(userId, {
          routineId,
          currentDateStr: "2026-08-25",
        });
        assert.equal(resPoll.reset, false);
      }

      // Re-packed item remains packed
      currentItems = await db.listItems(userId, "Morning Commute");
      assert.equal(currentItems.filter((i) => i.isPacked).length, 1);

      // Next day (2026-08-26) -> triggers reset again
      const resNextDay = await db.checkAndExecuteAutoReset(userId, {
        routineId,
        currentDateStr: "2026-08-26",
      });
      assert.equal(resNextDay.reset, true);
      currentItems = await db.listItems(userId, "Morning Commute");
      assert.equal(currentItems.filter((i) => i.isPacked).length, 0);
    });

    it("1.5 User scoping & invalid routineId protection in checkAndExecuteAutoReset", async () => {
      const db = new InMemoryConvexDB();
      const userA = "user_alice";
      const userB = "user_bob";

      const rA = await db.addRoutine(userA, { name: "Alice Routine", icon: "Tag" });
      await db.addItem(userA, { routine: "Alice Routine", name: "Alice Item" });
      const itemsA = await db.listItems(userA, "Alice Routine");
      await db.toggleItem(userA, itemsA[0]._id, true);

      // User B tries to reset User A's routine -> should fail safely
      const resUnauthorized = await db.checkAndExecuteAutoReset(userB, {
        routineId: rA,
        currentDateStr: "2026-08-25",
      });
      assert.equal(resUnauthorized.reset, false);

      // Alice's item is still packed
      const checkItemsA = await db.listItems(userA, "Alice Routine");
      assert.equal(checkItemsA[0].isPacked, true);

      // Non-existent routineId -> should return false cleanly
      const resNonExistent = await db.checkAndExecuteAutoReset(userA, {
        routineId: "routines_999999",
        currentDateStr: "2026-08-25",
      });
      assert.equal(resNonExistent.reset, false);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: Base64 URL Share and Import Codecs Hardening & Fuzzing
  // --------------------------------------------------------------------------
  describe("Suite 2: Base64 Share & Import Codecs with Unicode, Special Chars & Fuzzing", () => {
    it("2.1 High-diversity Unicode, CJK, Emoji and RTL characters roundtrip", () => {
      const payload = {
        name: "出国旅行 ✈️ & ワークショップ (Tokyo / 서울 / القاهرة)",
        icon: "Globe",
        items: [
          { name: "パスポート & ビザ 🪪", emoji: "FileText", quantity: 1, locationNote: "メインポケット" },
          { name: "노트북 & 충전기 💻⚡️", emoji: "Laptop", quantity: 2, locationNote: "가방 앞면" },
          { name: "مفتاح البيت 🔑 & بطاقة", emoji: "Key", quantity: 3, locationNote: "جيب داخلي" },
          { name: "Café & Crème Brûlée ☕️🍮", emoji: "Coffee", quantity: 1, locationNote: "Français & Español" },
          { name: "Unicode Math ∑(x²) ≥ π ≈ 3.14159 & Ω", emoji: "Sparkles", quantity: 4, locationNote: "Lab Note" },
          { name: "Complex Emojis 👨‍👩‍👧‍👦 🏃‍♀️‍➡️ 🏳️‍🌈 🧗‍♂️", emoji: "Heart", quantity: 1, locationNote: "Family trip" },
        ],
      };

      const encoded = browserEncodeSharePayload(payload);
      assert.ok(encoded && encoded.length > 0);

      // Verify no invalid raw characters in URL parameter
      assert.ok(!encoded.includes(" "));
      assert.ok(!encoded.includes("\n"));
      assert.ok(!encoded.includes('"'));

      const decoded = browserDecodeSharePayload(encoded);
      assert.ok(decoded);
      assert.equal(decoded.name, payload.name);
      assert.equal(decoded.icon, payload.icon);
      assert.equal(decoded.items.length, 6);

      for (let i = 0; i < payload.items.length; i++) {
        assert.equal(decoded.items[i].name, payload.items[i].name);
        assert.equal(decoded.items[i].emoji, payload.items[i].emoji);
        assert.equal(decoded.items[i].quantity, payload.items[i].quantity);
        assert.equal(decoded.items[i].locationNote, payload.items[i].locationNote);
      }
    });

    it("2.2 Special characters, quotes, slashes, HTML tags and symbols", () => {
      const payload = {
        name: `Special <tag> & "Quotes" / 'Single' \\ Backslash ?query=1#hash`,
        icon: "ShieldAlert",
        items: [
          {
            name: `<script>alert("xss")</script> & "item"`,
            emoji: "Shield",
            quantity: 5,
            locationNote: `Note with & % + = ? # / \\ " ' and \n newline`,
          },
          {
            name: `Item with {json: "brackets"} & [arrays]`,
            emoji: "Box",
            quantity: 1,
            locationNote: `Value: $100.00 | 100% | a + b = c`,
          },
        ],
      };

      const encoded = browserEncodeSharePayload(payload);
      const decoded = browserDecodeSharePayload(encoded);

      assert.ok(decoded);
      assert.equal(decoded.name, payload.name);
      assert.equal(decoded.items[0].name, `<script>alert("xss")</script> & "item"`);
      assert.equal(decoded.items[0].locationNote, `Note with & % + = ? # / \\ " ' and \n newline`);
      assert.equal(decoded.items[1].name, `Item with {json: "brackets"} & [arrays]`);
    });

    it("2.3 Adversarial fuzzing and malformed base64/JSON inputs", () => {
      // Empty & whitespace
      assert.equal(browserDecodeSharePayload(""), null);
      assert.equal(browserDecodeSharePayload("   "), null);
      assert.equal(browserDecodeSharePayload("\t\n"), null);

      // Raw non-base64 garbage
      assert.equal(browserDecodeSharePayload("not_base_64!@#$"), null);
      assert.equal(browserDecodeSharePayload("%%%invalid-uri-encoded"), null);

      // Valid base64 but invalid JSON
      const invalidJsonB64 = Buffer.from("{ malformed json ...", "utf8").toString("base64");
      assert.equal(browserDecodeSharePayload(invalidJsonB64), null);

      // Valid JSON primitives instead of object
      const numB64 = Buffer.from("12345", "utf8").toString("base64");
      assert.equal(browserDecodeSharePayload(numB64), null);

      const strB64 = Buffer.from('"just a string"', "utf8").toString("base64");
      assert.equal(browserDecodeSharePayload(strB64), null);

      const arrB64 = Buffer.from('[{"name":"Item"}]', "utf8").toString("base64");
      assert.equal(browserDecodeSharePayload(arrB64), null);

      // Valid JSON object missing required fields
      const missingItemsB64 = Buffer.from(JSON.stringify({ name: "Work" }), "utf8").toString("base64");
      assert.equal(browserDecodeSharePayload(missingItemsB64), null);

      const missingNameB64 = Buffer.from(JSON.stringify({ items: [] }), "utf8").toString("base64");
      assert.equal(browserDecodeSharePayload(missingNameB64), null);

      const itemsNotArrayB64 = Buffer.from(JSON.stringify({ name: "Work", items: "not-an-array" }), "utf8").toString("base64");
      assert.equal(browserDecodeSharePayload(itemsNotArrayB64), null);
    });

    it("2.4 Large payload stress testing (100 items)", () => {
      const itemsList = Array.from({ length: 100 }, (_, idx) => ({
        name: `Bulk Gear Item #${idx + 1} with Details & Notes`,
        emoji: "Package",
        quantity: (idx % 5) + 1,
        locationNote: `Bin Row ${String.fromCharCode(65 + (idx % 26))}, Slot ${idx + 1}`,
      }));

      const largePayload = {
        name: "Massive Inventory 100",
        icon: "Layers",
        items: itemsList,
      };

      const encoded = browserEncodeSharePayload(largePayload);
      assert.ok(encoded.length > 1000);

      const decoded = browserDecodeSharePayload(encoded);
      assert.ok(decoded);
      assert.equal(decoded.name, "Massive Inventory 100");
      assert.equal(decoded.items.length, 100);
      assert.equal(decoded.items[99].name, "Bulk Gear Item #100 with Details & Notes");
      assert.equal(decoded.items[99].locationNote, "Bin Row V, Slot 100");
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Markdown and JSON Export Serialization Formats
  // --------------------------------------------------------------------------
  describe("Suite 3: Markdown and JSON Export Serialization Formats", () => {
    it("3.1 Markdown formatting with various packing states, quantities, and notes", () => {
      const items = [
        { name: "MacBook Pro", isPacked: true, emoji: "Laptop" },
        { name: "USB-C Cable", isPacked: false, emoji: "Cable", quantity: 3, locationNote: "Front Pocket" },
        { name: "Passport", isPacked: false, emoji: "FileText", locationNote: "Jacket" },
        { name: "Water Bottle", isPacked: true, emoji: "CupSoda", quantity: 1 }, // quantity 1 -> no (1x) tag
      ];

      const md = generateMarkdownExport("Travel", items, "2026-08-25");

      // Verify Header & Date
      assert.match(md, /^# PocketChecker — Travel Checklist\n\n\*Exported on 2026-08-25\*\n\n/);

      // Verify Checkbox states
      assert.ok(md.includes("- [x] MacBook Pro\n"));
      assert.ok(md.includes("- [ ] USB-C Cable (3x) — *Front Pocket*\n"));
      assert.ok(md.includes("- [ ] Passport — *Jacket*\n"));
      assert.ok(md.includes("- [x] Water Bottle\n"));
      assert.ok(!md.includes("Water Bottle (1x)")); // (1x) should be omitted
    });

    it("3.2 Empty items export handling in Markdown and JSON", () => {
      const md = generateMarkdownExport("Empty Routine", [], "2026-08-25");
      assert.equal(md, "# PocketChecker — Empty Routine Checklist\n\n*Exported on 2026-08-25*\n\n");

      const jsonStr = generateJSONExport("Empty Routine", []);
      const parsed = JSON.parse(jsonStr);
      assert.equal(parsed.routine, "Empty Routine");
      assert.deepEqual(parsed.items, []);
    });

    it("3.3 JSON export schema compliance and roundtrip re-import", async () => {
      const originalItems = [
        { name: "Camera Sony A7IV", isPacked: true, emoji: "Camera", quantity: 1, locationNote: "Pelican Case" },
        { name: "SD Cards 128GB", isPacked: false, emoji: "HardDrive", quantity: 4, locationNote: "Card Wallet" },
        { name: "Tripod", isPacked: false, emoji: "Disc", locationNote: "Backpack Side" },
      ];

      const jsonStr = generateJSONExport("Photography", originalItems, "2026-08-25T14:30:00.000Z");
      const parsed = JSON.parse(jsonStr);

      assert.equal(parsed.routine, "Photography");
      assert.equal(parsed.exportedAt, "2026-08-25T14:30:00.000Z");
      assert.equal(parsed.items.length, 3);

      // Re-import exported JSON into InMemoryConvexDB
      const db = new InMemoryConvexDB();
      const userId = "photographer_1";
      const { routineName, insertedIds } = await db.applyPreset(userId, {
        name: parsed.routine,
        icon: "Camera",
        items: parsed.items,
      });

      assert.equal(routineName, "Photography");
      assert.equal(insertedIds.length, 3);

      const dbItems = await db.listItems(userId, "Photography");
      assert.equal(dbItems.length, 3);
      assert.equal(dbItems[0].name, "Camera Sony A7IV");
      assert.equal(dbItems[0].locationNote, "Pelican Case");
      assert.equal(dbItems[1].name, "SD Cards 128GB");
      assert.equal(dbItems[1].quantity, 4);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: Offline InMemoryConvexDB Reactivity, Queries, and Mutations
  // --------------------------------------------------------------------------
  describe("Suite 4: InMemoryConvexDB Full Offline Reactivity, CRUD & Concurrency", () => {
    it("4.1 Reactivity: subscribe & notify on every mutation, error tolerance in listeners", async () => {
      const db = new InMemoryConvexDB();
      const userId = "reactivity_user";
      let notifyCount = 0;

      // Listener 1: Healthy listener
      const unsub1 = db.subscribe(() => {
        notifyCount++;
      });

      // Listener 2: Erroneous listener (must not crash DB notifications)
      const unsub2 = db.subscribe(() => {
        throw new Error("Simulated subscriber error");
      });

      const rId = await db.addRoutine(userId, { name: "Daily", icon: "Calendar" });
      assert.equal(notifyCount, 1);

      const itemId = await db.addItem(userId, { routine: "Daily", name: "Keys" });
      assert.equal(notifyCount, 2);

      await db.toggleItem(userId, itemId, true);
      assert.equal(notifyCount, 3);

      await db.editItem(userId, { id: itemId, name: "Car Keys", quantity: 2 });
      assert.equal(notifyCount, 4);

      await db.reorderItems(userId, [itemId]);
      assert.equal(notifyCount, 5);

      await db.deleteItem(userId, itemId);
      assert.equal(notifyCount, 6);

      // Unsubscribe listener 1
      unsub1();
      unsub2();

      await db.addItem(userId, { routine: "Daily", name: "Wallet" });
      assert.equal(notifyCount, 6); // should not increment after unsub
    });

    it("4.2 Cascading updates: routine rename cascadingly updates item routines", async () => {
      const db = new InMemoryConvexDB();
      const userId = "cascade_user";

      const rId = await db.addRoutine(userId, { name: "Old Name", icon: "Box" });
      await db.addItem(userId, { routine: "Old Name", name: "Item 1" });
      await db.addItem(userId, { routine: "Old Name", name: "Item 2" });
      await db.addItem(userId, { routine: "Old Name", name: "Item 3" });

      assert.equal((await db.listItems(userId, "Old Name")).length, 3);
      assert.equal((await db.listItems(userId, "New Name")).length, 0);

      // Rename routine
      await db.updateRoutine(userId, {
        id: rId,
        name: "New Name",
        icon: "BoxOpen",
      });

      // Old name should now return 0 items, New Name returns all 3
      assert.equal((await db.listItems(userId, "Old Name")).length, 0);
      const newItems = await db.listItems(userId, "New Name");
      assert.equal(newItems.length, 3);
      assert.equal(newItems[0].routine, "New Name");
      assert.equal(newItems[1].routine, "New Name");
      assert.equal(newItems[2].routine, "New Name");
    });

    it("4.3 Cascading deletions: deleteRoutine deletes all child items", async () => {
      const db = new InMemoryConvexDB();
      const userId = "delete_cascade_user";

      const r1 = await db.addRoutine(userId, { name: "Keep Me", icon: "Check" });
      const r2 = await db.addRoutine(userId, { name: "Delete Me", icon: "Trash" });

      await db.addItem(userId, { routine: "Keep Me", name: "Keep 1" });
      await db.addItem(userId, { routine: "Delete Me", name: "Delete 1" });
      await db.addItem(userId, { routine: "Delete Me", name: "Delete 2" });

      await db.deleteRoutine(userId, r2);

      const routines = await db.listRoutines(userId);
      assert.equal(routines.length, 1);
      assert.equal(routines[0].name, "Keep Me");

      assert.equal((await db.listItems(userId, "Delete Me")).length, 0);
      assert.equal((await db.listItems(userId, "Keep Me")).length, 1);
    });

    it("4.4 Batch add & preset deduplication (case-insensitive)", async () => {
      const db = new InMemoryConvexDB();
      const userId = "dedup_user";

      // 1. Initial preset
      const res1 = await db.applyPreset(userId, {
        name: "Tech Kit",
        icon: "Cpu",
        items: [
          { name: "Power Bank", emoji: "Battery" },
          { name: "USB-C Cable", emoji: "Cable" },
        ],
      });
      assert.equal(res1.insertedIds.length, 2);

      // 2. Re-apply preset with 1 existing (case-insensitive "usb-c cable") and 1 new ("Flash Drive")
      const res2 = await db.applyPreset(userId, {
        name: "Tech Kit",
        icon: "Cpu",
        items: [
          { name: "usb-c cable", emoji: "Cable" }, // duplicate!
          { name: "Flash Drive", emoji: "HardDrive" }, // new
        ],
      });
      assert.equal(res2.insertedIds.length, 1);

      const allItems = await db.listItems(userId, "Tech Kit");
      assert.equal(allItems.length, 3);
      assert.deepEqual(
        allItems.map((i) => i.name),
        ["Power Bank", "USB-C Cable", "Flash Drive"]
      );
    });

    it("4.5 Multi-tenant strict data isolation across 5 concurrent users", async () => {
      const db = new InMemoryConvexDB();
      const users = ["user_1", "user_2", "user_3", "user_4", "user_5"];

      // Each user adds the same routine name "Personal" with distinct items
      for (let u = 0; u < users.length; u++) {
        const uId = users[u];
        await db.addRoutine(uId, { name: "Personal", icon: "User" });
        await db.addItem(uId, {
          routine: "Personal",
          name: `Secret Item for ${uId}`,
        });
      }

      // Verify each user only sees their own routine and item
      for (let u = 0; u < users.length; u++) {
        const uId = users[u];
        const routines = await db.listRoutines(uId);
        assert.equal(routines.length, 1);
        assert.equal(routines[0].userId, uId);

        const items = await db.listItems(uId, "Personal");
        assert.equal(items.length, 1);
        assert.equal(items[0].userId, uId);
        assert.equal(items[0].name, `Secret Item for ${uId}`);
      }
    });

    it("4.6 High-throughput mutation stress test (500 items + rapid toggles)", async () => {
      const db = new InMemoryConvexDB();
      const userId = "stress_tester";

      await db.addRoutine(userId, { name: "Stress Routine", icon: "Zap" });

      // Add 500 items in batches of 50
      for (let batch = 0; batch < 10; batch++) {
        const batchItems = Array.from({ length: 50 }, (_, i) => ({
          name: `Item #${batch * 50 + i + 1}`,
          emoji: "Package",
          quantity: (i % 3) + 1,
        }));
        await db.addItemsBatch(userId, "Stress Routine", batchItems);
      }

      let allItems = await db.listItems(userId, "Stress Routine");
      assert.equal(allItems.length, 500);

      // Verify strict sequential ordering (0 to 499)
      for (let i = 0; i < 500; i++) {
        assert.equal(allItems[i].order, i);
      }

      // Rapidly toggle all even items to packed
      for (let i = 0; i < 500; i += 2) {
        await db.toggleItem(userId, allItems[i]._id, true);
      }

      allItems = await db.listItems(userId, "Stress Routine");
      const packedCount = allItems.filter((i) => i.isPacked).length;
      assert.equal(packedCount, 250);

      // Reset all
      await db.resetItems(userId, "Stress Routine");
      allItems = await db.listItems(userId, "Stress Routine");
      assert.equal(allItems.filter((i) => i.isPacked).length, 0);

      // Delete all and restore
      const deleted = await db.deleteAllItems(userId, "Stress Routine");
      assert.equal(deleted.length, 500);
      assert.equal((await db.listItems(userId, "Stress Routine")).length, 0);

      const restoredIds = await db.restoreItems(userId, deleted);
      assert.equal(restoredIds.length, 500);
      assert.equal((await db.listItems(userId, "Stress Routine")).length, 500);
    });
  });
});
