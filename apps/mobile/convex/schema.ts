import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    userId: v.string(),
    routine: v.string(),
    name: v.string(),
    isPacked: v.boolean(),
    isDefault: v.optional(v.boolean()),
    emoji: v.optional(v.string()),
    quantity: v.optional(v.number()),
    locationNote: v.optional(v.string()),
    order: v.optional(v.number()),
  })
    .index("by_user_routine", ["userId", "routine"])
    .index("by_user", ["userId"]),

  routines: defineTable({
    userId: v.string(),
    name: v.string(),
    icon: v.string(),
    autoResetTime: v.optional(v.string()),
    autoResetDays: v.optional(v.array(v.number())),
    lastResetDate: v.optional(v.string()),
    order: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),
});
