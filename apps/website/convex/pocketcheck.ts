import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** No-op kept for API compatibility — new users start with an empty slate. */
export const ensureInitialized = mutation({
  args: {},
  handler: async () => {
    // Nothing to seed — users create their own destinations and items.
  },
});

/** List all items for a given routine (for the current user), sorted by order. */
export const listItems = query({
  args: { routine: v.string() },
  handler: async (ctx, { routine }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    const items = await ctx.db
      .query("items")
      .withIndex("by_user_routine", (q) =>
        q.eq("userId", userId).eq("routine", routine)
      )
      .collect();

    // Sort by order field; items without order fall back to creation order (_id)
    return items.sort((a, b) => {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      return ao - bo;
    });
  },
});

/** List all custom routines created by the current user, sorted by order. */
export const listRoutines = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    const routines = await ctx.db
      .query("routines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return routines.sort((a, b) => {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      return ao - bo;
    });
  },
});

/** Add a new custom routine for the current user. */
export const addRoutine = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    autoResetTime: v.optional(v.string()),
    autoResetDays: v.optional(v.array(v.number())),
  },
  handler: async (ctx, { name, icon, autoResetTime, autoResetDays }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    // Avoid duplicate routine names
    const existing = await ctx.db
      .query("routines")
      .withIndex("by_user_name", (q) =>
        q.eq("userId", userId).eq("name", name)
      )
      .first();

    if (existing) return existing._id;

    // Assign next order value
    const allRoutines = await ctx.db
      .query("routines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const maxOrder = allRoutines.reduce((m, r) => Math.max(m, r.order ?? 0), -1);

    return await ctx.db.insert("routines", {
      userId,
      name,
      icon,
      order: maxOrder + 1,
      ...(autoResetTime ? { autoResetTime } : {}),
      ...(autoResetDays ? { autoResetDays } : {}),
    });
  },
});

/** Add a new item to a routine for the current user. */
export const addItem = mutation({
  args: {
    routine: v.string(),
    name: v.string(),
    emoji: v.optional(v.string()),
    quantity: v.optional(v.number()),
    locationNote: v.optional(v.string()),
  },
  handler: async (ctx, { routine, name, emoji, quantity, locationNote }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    // Assign next order value within the routine
    const existing = await ctx.db
      .query("items")
      .withIndex("by_user_routine", (q) =>
        q.eq("userId", userId).eq("routine", routine)
      )
      .collect();
    const maxOrder = existing.reduce((m, i) => Math.max(m, i.order ?? 0), -1);

    return await ctx.db.insert("items", {
      userId,
      routine,
      name,
      isPacked: false,
      order: maxOrder + 1,
      ...(emoji ? { emoji } : {}),
      ...(quantity !== undefined && quantity > 1 ? { quantity } : {}),
      ...(locationNote ? { locationNote } : {}),
    });
  },
});

/** Edit an item's details. */
export const editItem = mutation({
  args: {
    id: v.id("items"),
    name: v.string(),
    emoji: v.optional(v.string()),
    quantity: v.optional(v.number()),
    locationNote: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, emoji, quantity, locationNote }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(id, {
      name,
      emoji: emoji ?? undefined,
      quantity: quantity && quantity > 1 ? quantity : undefined,
      locationNote: locationNote ?? undefined,
    });
  },
});

/** Update a custom routine's name, icon, and auto-reset schedule. */
export const updateRoutine = mutation({
  args: {
    id: v.id("routines"),
    name: v.string(),
    icon: v.string(),
    autoResetTime: v.optional(v.string()),
    autoResetDays: v.optional(v.array(v.number())),
  },
  handler: async (ctx, { id, name, icon, autoResetTime, autoResetDays }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const routine = await ctx.db.get(id);
    if (!routine || routine.userId !== userId) throw new Error("Not found");

    const oldName = routine.name;

    // Rename all items belonging to the old routine name
    if (oldName !== name) {
      const items = await ctx.db
        .query("items")
        .withIndex("by_user_routine", (q) =>
          q.eq("userId", userId).eq("routine", oldName)
        )
        .collect();
      for (const item of items) {
        await ctx.db.patch(item._id, { routine: name });
      }
    }

    await ctx.db.patch(id, {
      name,
      icon,
      autoResetTime: autoResetTime ?? undefined,
      autoResetDays: autoResetDays ?? undefined,
    });
  },
});

/** Delete a custom routine and all its items. */
export const deleteRoutine = mutation({
  args: {
    id: v.id("routines"),
  },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const routine = await ctx.db.get(id);
    if (!routine || routine.userId !== userId) throw new Error("Not found");

    // Delete all items in this routine
    const items = await ctx.db
      .query("items")
      .withIndex("by_user_routine", (q) =>
        q.eq("userId", userId).eq("routine", routine.name)
      )
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(id);
  },
});

/** Toggle the packed state of an item. */
export const toggleItem = mutation({
  args: {
    id: v.id("items"),
    isPacked: v.boolean(),
  },
  handler: async (ctx, { id, isPacked }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(id, { isPacked });
  },
});

/** Delete an item by ID. */
export const deleteItem = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(id);
  },
});

/** Reset all items in a routine (mark all as unpacked). */
export const resetItems = mutation({
  args: {
    routine: v.string(),
  },
  handler: async (ctx, { routine }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const items = await ctx.db
      .query("items")
      .withIndex("by_user_routine", (q) =>
        q.eq("userId", userId).eq("routine", routine)
      )
      .collect();

    for (const item of items) {
      await ctx.db.patch(item._id, { isPacked: false });
    }
  },
});

/** Delete all items in a routine for the current user. */
export const deleteAllItems = mutation({
  args: {
    routine: v.string(),
  },
  handler: async (ctx, { routine }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const items = await ctx.db
      .query("items")
      .withIndex("by_user_routine", (q) =>
        q.eq("userId", userId).eq("routine", routine)
      )
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});

/** Restore items (for Undo functionality). */
export const restoreItems = mutation({
  args: {
    items: v.array(
      v.object({
        routine: v.string(),
        name: v.string(),
        isPacked: v.boolean(),
        emoji: v.optional(v.string()),
        quantity: v.optional(v.number()),
        locationNote: v.optional(v.string()),
        order: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { items }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const inserted = [];
    for (const item of items) {
      const id = await ctx.db.insert("items", {
        userId,
        routine: item.routine,
        name: item.name,
        isPacked: item.isPacked,
        order: item.order ?? 0,
        ...(item.emoji ? { emoji: item.emoji } : {}),
        ...(item.quantity ? { quantity: item.quantity } : {}),
        ...(item.locationNote ? { locationNote: item.locationNote } : {}),
      });
      inserted.push(id);
    }
    return inserted;
  },
});

/** Reset all items across all routines for the current user (mark all as unpacked). */
export const resetAllRoutines = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const items = await ctx.db
      .query("items")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const item of items) {
      await ctx.db.patch(item._id, { isPacked: false });
    }
  },
});

/** Check and execute scheduled routine auto-reset based on user-configured time & active days. */
export const checkAndExecuteAutoReset = mutation({
  args: {
    routineId: v.id("routines"),
    currentDateStr: v.string(), // e.g. "2026-08-23"
  },
  handler: async (ctx, { routineId, currentDateStr }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { reset: false };
    const userId = identity.subject;

    const routine = await ctx.db.get(routineId);
    if (!routine || routine.userId !== userId) return { reset: false };

    // If already reset today, skip
    if (routine.lastResetDate === currentDateStr) {
      return { reset: false };
    }

    // Reset all items in this routine
    const items = await ctx.db
      .query("items")
      .withIndex("by_user_routine", (q) =>
        q.eq("userId", userId).eq("routine", routine.name)
      )
      .collect();

    for (const item of items) {
      await ctx.db.patch(item._id, { isPacked: false });
    }

    // Mark as reset for today
    await ctx.db.patch(routineId, { lastResetDate: currentDateStr });

    return { reset: true, routineName: routine.name };
  },
});

/** Reorder items by writing sequential order values for the full sorted list. */
export const reorderItems = mutation({
  args: {
    ids: v.array(v.id("items")),
  },
  handler: async (ctx, { ids }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    for (let i = 0; i < ids.length; i++) {
      await ctx.db.patch(ids[i], { order: i });
    }
  },
});

/** Reorder routines by writing sequential order values for the full sorted list. */
export const reorderRoutines = mutation({
  args: {
    ids: v.array(v.id("routines")),
  },
  handler: async (ctx, { ids }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    for (let i = 0; i < ids.length; i++) {
      await ctx.db.patch(ids[i], { order: i });
    }
  },
});

/** Add multiple items in batch to a routine for the current user. */
export const addItemsBatch = mutation({
  args: {
    routine: v.string(),
    items: v.array(
      v.object({
        name: v.string(),
        emoji: v.optional(v.string()),
        quantity: v.optional(v.number()),
        locationNote: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { routine, items }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    if (!items || items.length === 0) return [];

    // Get current max order within the routine
    const existing = await ctx.db
      .query("items")
      .withIndex("by_user_routine", (q) =>
        q.eq("userId", userId).eq("routine", routine)
      )
      .collect();
    let currentOrder = existing.reduce((m, i) => Math.max(m, i.order ?? 0), -1);

    const insertedIds = [];
    for (const item of items) {
      const trimmed = item.name?.trim();
      if (!trimmed) continue;
      currentOrder += 1;
      const id = await ctx.db.insert("items", {
        userId,
        routine,
        name: trimmed,
        isPacked: false,
        order: currentOrder,
        ...(item.emoji ? { emoji: item.emoji } : {}),
        ...(item.quantity && item.quantity > 1 ? { quantity: item.quantity } : {}),
        ...(item.locationNote ? { locationNote: item.locationNote } : {}),
      });
      insertedIds.push(id);
    }

    return insertedIds;
  },
});

/** Create a preset routine and populate it with preset items. */
export const applyPreset = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    items: v.array(
      v.object({
        name: v.string(),
        emoji: v.optional(v.string()),
        quantity: v.optional(v.number()),
        locationNote: v.optional(v.string()),
      })
    ),
    targetRoutine: v.optional(v.string()),
  },
  handler: async (ctx, { name, icon, items, targetRoutine }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const routineName = targetRoutine?.trim() || name.trim();

    // Check if routine already exists
    const allRoutines = await ctx.db
      .query("routines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const existingRoutine = allRoutines.find(
      (r) => r.name.toLowerCase().trim() === routineName.toLowerCase().trim()
    );

    let finalRoutineName = routineName;
    if (!existingRoutine) {
      const maxOrder = allRoutines.reduce((m, r) => Math.max(m, r.order ?? 0), -1);
      await ctx.db.insert("routines", {
        userId,
        name: routineName,
        icon: icon || "tag",
        order: maxOrder + 1,
      });
    } else {
      finalRoutineName = existingRoutine.name;
    }

    // Insert items that do not already exist in the routine
    const existingItems = await ctx.db
      .query("items")
      .withIndex("by_user_routine", (q) =>
        q.eq("userId", userId).eq("routine", finalRoutineName)
      )
      .collect();

    const existingNames = new Set(
      existingItems.map((i) => i.name.toLowerCase().trim())
    );
    let currentOrder = existingItems.reduce(
      (m, i) => Math.max(m, i.order ?? 0),
      -1
    );

    const insertedIds = [];
    for (const item of items) {
      const trimmed = item.name?.trim();
      if (!trimmed || existingNames.has(trimmed.toLowerCase())) {
        continue;
      }
      currentOrder += 1;
      const id = await ctx.db.insert("items", {
        userId,
        routine: finalRoutineName,
        name: trimmed,
        isPacked: false,
        order: currentOrder,
        ...(item.emoji ? { emoji: item.emoji } : {}),
        ...(item.quantity && item.quantity > 1 ? { quantity: item.quantity } : {}),
        ...(item.locationNote ? { locationNote: item.locationNote } : {}),
      });
      insertedIds.push(id);
    }

    return { routineName: finalRoutineName, insertedIds };
  },
});
