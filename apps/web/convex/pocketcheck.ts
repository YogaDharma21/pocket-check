import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** No-op kept for API compatibility — new users start with an empty slate. */
export const ensureInitialized = mutation({
  args: {},
  handler: async (_ctx) => {
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
  },
  handler: async (ctx, { name, icon }) => {
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

    return await ctx.db.insert("routines", { userId, name, icon, order: maxOrder + 1 });
  },
});

/** Add a new item to a routine for the current user. */
export const addItem = mutation({
  args: {
    routine: v.string(),
    name: v.string(),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, { routine, name, emoji }) => {
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
    });
  },
});

/** Edit an item's name and/or emoji. */
export const editItem = mutation({
  args: {
    id: v.id("items"),
    name: v.string(),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, emoji }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(id, { name, emoji: emoji ?? undefined });
  },
});

/** Update a custom routine's name and icon. */
export const updateRoutine = mutation({
  args: {
    id: v.id("routines"),
    name: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, { id, name, icon }) => {
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

    await ctx.db.patch(id, { name, icon });
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
