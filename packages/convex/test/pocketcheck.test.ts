import test from "node:test";
import assert from "node:assert/strict";
import {
  editItem,
  toggleItem,
  deleteItem,
  reorderItems,
  reorderRoutines,
} from "../convex/pocketcheck.ts";

function createMockCtx(
  identity: { subject: string } | null,
  docs: Record<string, { userId: string; [key: string]: unknown }> = {}
) {
  const patches: Record<string, unknown> = {};
  const deletions: string[] = [];

  return {
    ctx: {
      auth: {
        getUserIdentity: async () => identity,
      },
      db: {
        get: async (id: string) => docs[id] ?? null,
        patch: async (id: string, patch: unknown) => {
          patches[id] = patch;
        },
        delete: async (id: string) => {
          deletions.push(id);
        },
      },
    },
    patches,
    deletions,
  };
}

test("editItem rejects unauthenticated user", async () => {
  const { ctx } = createMockCtx(null);
  await assert.rejects(
    // @ts-expect-error test invoke
    () => editItem._handler(ctx, { id: "item-1", name: "Wallet" }),
    { message: "Not authenticated" }
  );
});

test("editItem rejects mutation when item belongs to another user", async () => {
  const { ctx } = createMockCtx({ subject: "user-1" }, {
    "item-1": { userId: "user-victim", name: "Old name" },
  });
  await assert.rejects(
    // @ts-expect-error test invoke
    () => editItem._handler(ctx, { id: "item-1", name: "Hacked" }),
    { message: "Not found" }
  );
});

test("editItem patches when item belongs to current user", async () => {
  const { ctx, patches } = createMockCtx({ subject: "user-1" }, {
    "item-1": { userId: "user-1", name: "Old name" },
  });
  // @ts-expect-error test invoke
  await editItem._handler(ctx, { id: "item-1", name: "New name" });
  assert.deepEqual(patches["item-1"], {
    name: "New name",
    emoji: undefined,
    quantity: undefined,
    locationNote: undefined,
  });
});

test("toggleItem rejects mutation when item belongs to another user", async () => {
  const { ctx } = createMockCtx({ subject: "user-1" }, {
    "item-1": { userId: "user-victim", isPacked: false },
  });
  await assert.rejects(
    // @ts-expect-error test invoke
    () => toggleItem._handler(ctx, { id: "item-1", isPacked: true }),
    { message: "Not found" }
  );
});

test("toggleItem patches when item belongs to current user", async () => {
  const { ctx, patches } = createMockCtx({ subject: "user-1" }, {
    "item-1": { userId: "user-1", isPacked: false },
  });
  // @ts-expect-error test invoke
  await toggleItem._handler(ctx, { id: "item-1", isPacked: true });
  assert.deepEqual(patches["item-1"], { isPacked: true });
});

test("deleteItem rejects mutation when item belongs to another user", async () => {
  const { ctx } = createMockCtx({ subject: "user-1" }, {
    "item-1": { userId: "user-victim" },
  });
  await assert.rejects(
    // @ts-expect-error test invoke
    () => deleteItem._handler(ctx, { id: "item-1" }),
    { message: "Not found" }
  );
});

test("deleteItem deletes when item belongs to current user", async () => {
  const { ctx, deletions } = createMockCtx({ subject: "user-1" }, {
    "item-1": { userId: "user-1" },
  });
  // @ts-expect-error test invoke
  await deleteItem._handler(ctx, { id: "item-1" });
  assert.deepEqual(deletions, ["item-1"]);
});

test("reorderItems rejects when any item belongs to another user", async () => {
  const { ctx } = createMockCtx({ subject: "user-1" }, {
    "item-1": { userId: "user-1" },
    "item-2": { userId: "user-victim" },
  });
  await assert.rejects(
    // @ts-expect-error test invoke
    () => reorderItems._handler(ctx, { ids: ["item-1", "item-2"] }),
    { message: "Not found" }
  );
});

test("reorderItems patches orders when all items belong to current user", async () => {
  const { ctx, patches } = createMockCtx({ subject: "user-1" }, {
    "item-1": { userId: "user-1" },
    "item-2": { userId: "user-1" },
  });
  // @ts-expect-error test invoke
  await reorderItems._handler(ctx, { ids: ["item-2", "item-1"] });
  assert.deepEqual(patches["item-2"], { order: 0 });
  assert.deepEqual(patches["item-1"], { order: 1 });
});

test("reorderRoutines rejects when any routine belongs to another user", async () => {
  const { ctx } = createMockCtx({ subject: "user-1" }, {
    "routine-1": { userId: "user-1" },
    "routine-2": { userId: "user-victim" },
  });
  await assert.rejects(
    // @ts-expect-error test invoke
    () => reorderRoutines._handler(ctx, { ids: ["routine-1", "routine-2"] }),
    { message: "Not found" }
  );
});

test("reorderRoutines patches orders when all routines belong to current user", async () => {
  const { ctx, patches } = createMockCtx({ subject: "user-1" }, {
    "routine-1": { userId: "user-1" },
    "routine-2": { userId: "user-1" },
  });
  // @ts-expect-error test invoke
  await reorderRoutines._handler(ctx, { ids: ["routine-2", "routine-1"] });
  assert.deepEqual(patches["routine-2"], { order: 0 });
  assert.deepEqual(patches["routine-1"], { order: 1 });
});
