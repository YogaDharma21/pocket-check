export interface PresetItem {
  name: string;
  emoji?: string;
  quantity?: number;
  locationNote?: string;
}

export interface PresetRoutine {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: PresetItem[];
}

export const SMART_PRESETS: PresetRoutine[] = [
  {
    id: "campus",
    name: "Campus",
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
];

const KEYWORD_ICON_MAP: { keywords: string[]; icon: string }[] = [
  { keywords: ["laptop", "macbook", "notebook computer"], icon: "Laptop" },
  {
    keywords: [
      "laptop charger",
      "phone charger",
      "charger",
      "power adapter",
      "magsafe",
      "adapter",
    ],
    icon: "Plug",
  },
  {
    keywords: ["cable", "usb cable", "usb", "wire", "cord", "lightning"],
    icon: "Cable",
  },
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
      "tws",
    ],
    icon: "Headphones",
  },
  {
    keywords: ["wallet", "purse", "billfold", "cash", "money", "dompet"],
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
    keywords: [
      "id card",
      "id badge",
      "badge",
      "access card",
      "keycard",
      "student card",
      "ktp",
      "card",
    ],
    icon: "IdCard",
  },
  {
    keywords: [
      "notebook",
      "journal",
      "notepad",
      "diary",
      "textbook",
      "book",
      "notes",
      "buku",
    ],
    icon: "BookOpen",
  },
  {
    keywords: ["passport", "paspor", "visa", "boarding pass", "ticket"],
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
      "baju",
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
    keywords: ["keys", "house key", "car key", "keychain", "key", "kunci"],
    icon: "Key",
  },
  {
    keywords: [
      "handphone",
      "hp",
      "phone",
      "smartphone",
      "iphone",
      "android",
      "cellphone",
    ],
    icon: "Smartphone",
  },
  {
    keywords: ["mask", "facemask", "face mask", "masker"],
    icon: "Shield",
  },
  {
    keywords: ["glasses", "sunglasses", "spectacles", "kacamata"],
    icon: "Glasses",
  },
  { keywords: ["watch", "smartwatch", "apple watch", "jam"], icon: "Watch" },
  { keywords: ["umbrella", "raincoat", "payung"], icon: "Umbrella" },
  {
    keywords: ["pen", "pencil", "highlighter", "marker", "stationery", "pulpen"],
    icon: "Pen",
  },
  {
    keywords: ["gym", "towel", "workout", "dumbbell", "weights"],
    icon: "Dumbbell",
  },
  {
    keywords: ["medicine", "pill", "pills", "vitamins", "bandaid", "first aid", "obat"],
    icon: "Pill",
  },
  { keywords: ["camera", "gopro", "lens", "dslr"], icon: "Camera" },
  { keywords: ["shoes", "sneakers", "boots", "sandals", "sepatu"], icon: "Footprints" },
];

/** Automatically detect a matching Lucide icon name for an item based on its name. */
export function detectIconForItem(name: string): string {
  const lower = name.toLowerCase().trim();
  if (!lower) return "Tag";

  // 1. Exact keyword match
  for (const entry of KEYWORD_ICON_MAP) {
    for (const keyword of entry.keywords) {
      if (lower === keyword) {
        return entry.icon;
      }
    }
  }

  // 2. Substring match (item contains the keyword)
  for (const entry of KEYWORD_ICON_MAP) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        return entry.icon;
      }
    }
  }

  // 3. Word-by-word token match
  const words = lower.split(/[\s_-]+/).filter((w) => w.length > 2);
  for (const word of words) {
    for (const entry of KEYWORD_ICON_MAP) {
      if (entry.keywords.includes(word)) {
        return entry.icon;
      }
    }
  }

  return "Tag";
}

/**
 * Parse comma-separated, semicolon-separated, or newline-separated multi-item string.
 * Example input: "USB Cable, Notebook, ID Card" or multi-line list.
 */
export function parseMultiItemInput(
  rawInput: string,
  fallbackIcon?: string
): { name: string; emoji?: string }[] {
  if (!rawInput || !rawInput.trim()) return [];

  const rawTokens = rawInput
    .split(/[,\n;\r]+/)
    .map((token) =>
      token
        .replace(/^[\s\u2022\-*0-9.)\]]+/, "") // Remove bullet points or numbers
        .trim()
    )
    .filter((token) => token.length > 0);

  const cleanFallback =
    fallbackIcon && fallbackIcon.trim() ? fallbackIcon.trim() : undefined;

  return rawTokens.map((name) => {
    const detected = detectIconForItem(name);
    const finalIcon =
      detected && detected !== "Tag"
        ? detected
        : cleanFallback || detected || "Tag";

    return {
      name,
      emoji: finalIcon,
    };
  });
}
