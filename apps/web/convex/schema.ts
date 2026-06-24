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
  })
    .index("by_user_routine", ["userId", "routine"])
    .index("by_user", ["userId"]),

  routines: defineTable({
    userId: v.string(),
    name: v.string(),
    icon: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),
});
