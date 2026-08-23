export interface PresetItem {
  name: string
  emoji?: string
}

export interface PresetRoutine {
  id: string
  name: string
  icon: string
  description: string
  items: PresetItem[]
}

export const SMART_PRESETS: PresetRoutine[] = [
  {
    id: "kampus",
    name: "Kampus",
    icon: "GraduationCap",
    description:
      "Essential gear for classes, campus studying, and student life.",
    items: [
      { name: "Laptop", emoji: "Laptop" },
      { name: "Laptop Charger", emoji: "Plug" },
      { name: "Mouse", emoji: "Mouse" },
      { name: "Earphones", emoji: "Headphones" },
      { name: "Wallet", emoji: "Wallet" },
      { name: "Water Bottle", emoji: "CupSoda" },
    ],
  },
  {
    id: "work",
    name: "Work",
    icon: "Briefcase",
    description:
      "Daily office essentials for meetings, desk work, and productivity.",
    items: [
      { name: "Laptop", emoji: "Laptop" },
      { name: "Charger", emoji: "Plug" },
      { name: "ID Card", emoji: "IdCard" },
      { name: "Notebook", emoji: "BookOpen" },
      { name: "Wallet", emoji: "Wallet" },
    ],
  },
  {
    id: "travel",
    name: "Travel",
    icon: "Plane",
    description:
      "Packing checklist for flights, weekend getaways, and vacations.",
    items: [
      { name: "Passport", emoji: "FileText" },
      { name: "Wallet", emoji: "Wallet" },
      { name: "Charger", emoji: "Plug" },
      { name: "Clothes", emoji: "Shirt" },
      { name: "Toiletries", emoji: "Sparkles" },
    ],
  },
]

const KEYWORD_ICON_MAP: Array<{ keywords: string[]; icon: string }> = [
  { keywords: ["laptop", "macbook", "notebook computer"], icon: "Laptop" },
  {
    keywords: ["laptop charger", "charger", "power adapter", "magsafe"],
    icon: "Plug",
  },
  { keywords: ["cable", "usb", "wire", "cord", "lightning"], icon: "Cable" },
  {
    keywords: ["mouse", "trackpad", "trackball", "magic mouse"],
    icon: "Mouse",
  },
  {
    keywords: [
      "earphone",
      "earphones",
      "headphone",
      "headphones",
      "earbud",
      "earbuds",
      "airpods",
    ],
    icon: "Headphones",
  },
  {
    keywords: ["wallet", "purse", "billfold", "cash", "money"],
    icon: "Wallet",
  },
  {
    keywords: [
      "water bottle",
      "bottle",
      "tumbler",
      "hydroflask",
      "flask",
      "water",
      "drink",
    ],
    icon: "CupSoda",
  },
  {
    keywords: ["id card", "id badge", "badge", "access card", "keycard"],
    icon: "IdCard",
  },
  {
    keywords: [
      "notebook",
      "journal",
      "notepad",
      "diary",
      "book",
      "textbook",
    ],
    icon: "BookOpen",
  },
  {
    keywords: ["passport", "visa", "boarding pass", "ticket"],
    icon: "FileText",
  },
  {
    keywords: [
      "clothes",
      "shirt",
      "t-shirt",
      "pants",
      "jacket",
      "sweater",
      "hoodie",
      "underwear",
      "socks",
    ],
    icon: "Shirt",
  },
  {
    keywords: [
      "toiletries",
      "toothbrush",
      "toothpaste",
      "soap",
      "shampoo",
      "skincare",
      "deodorant",
      "sunscreen",
    ],
    icon: "Sparkles",
  },
  {
    keywords: ["keys", "house key", "car key", "keychain", "key"],
    icon: "Key",
  },
  {
    keywords: ["phone", "smartphone", "iphone", "android", "cellphone"],
    icon: "Smartphone",
  },
  {
    keywords: ["glasses", "sunglasses", "spectacles", "contacts"],
    icon: "Glasses",
  },
  { keywords: ["watch", "smartwatch", "apple watch"], icon: "Watch" },
  { keywords: ["umbrella", "raincoat"], icon: "Umbrella" },
  { keywords: ["pen", "pencil", "highlighter", "marker"], icon: "Pen" },
  {
    keywords: ["gym", "towel", "workout", "dumbbell", "weights"],
    icon: "Dumbbell",
  },
  {
    keywords: ["medicine", "pill", "pills", "vitamins", "bandaid", "first aid"],
    icon: "Pill",
  },
  { keywords: ["camera", "gopro", "lens", "dslr"], icon: "Camera" },
  { keywords: ["shoes", "sneakers", "boots", "sandals"], icon: "Footprints" },
]

/** Automatically detect a matching Lucide icon name for an item based on its name. */
export function detectIconForItem(name: string): string {
  const lower = name.toLowerCase().trim()
  if (!lower) return "Tag"

  // Exact / partial match against keyword list
  for (const entry of KEYWORD_ICON_MAP) {
    for (const keyword of entry.keywords) {
      if (
        lower === keyword ||
        lower.includes(keyword) ||
        keyword.includes(lower)
      ) {
        return entry.icon
      }
    }
  }

  // Word-by-word token fallback
  const words = lower.split(/[\s_-]+/)
  for (const word of words) {
    if (word.length <= 2) continue
    for (const entry of KEYWORD_ICON_MAP) {
      if (entry.keywords.includes(word)) {
        return entry.icon
      }
    }
  }

  return "Tag"
}

/**
 * Parse comma-separated, semicolon-separated, or newline-separated multi-item string.
 * Example input: "USB Cable, Notebook, ID Card" or multi-line list.
 */
export function parseMultiItemInput(
  rawInput: string
): Array<{ name: string; emoji?: string }> {
  if (!rawInput.trim()) return []

  const rawTokens = rawInput
    .split(/[,\n;\r]+/)
    .map((token) =>
      token
        .replace(/^[\s•\-*0-9.)\]]+/, "") // Remove bullet points or numbers
        .trim()
    )
    .filter((token) => token.length > 0)

  return rawTokens.map((name) => {
    const icon = detectIconForItem(name)
    return {
      name,
      emoji: icon !== "Tag" ? icon : undefined,
    }
  })
}
