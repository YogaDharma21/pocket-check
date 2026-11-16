import type { PresetItem, PresetRoutine } from "@pocket-check/types";

export type { PresetItem, PresetRoutine };

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

export const KEYWORD_ICON_MAP: Array<{ keywords: string[]; icon: string }> = [
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
    keywords: [
      "medicine",
      "pill",
      "pills",
      "vitamins",
      "bandaid",
      "first aid",
      "obat",
    ],
    icon: "Pill",
  },
  { keywords: ["camera", "gopro", "lens", "dslr"], icon: "Camera" },
  {
    keywords: ["shoes", "sneakers", "boots", "sandals", "sepatu"],
    icon: "Footprints",
  },
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

export interface ParsedItem {
  name: string;
  emoji?: string;
  quantity?: number;
  locationNote?: string;
}

/**
 * Parse comma-separated, semicolon-separated, or newline-separated multi-item string.
 * Supports markdown checkboxes (- [ ]), numbered lists (1.), trailing quantities (x2, (3)),
 * and inline location tags (@ Desk).
 * Example input: "- [ ] USB Cable x2 @ Desk\n- [ ] Passport @ Front Pocket"
 */
export function parseMultiItemInput(
  rawInput: string,
  fallbackIcon?: string
): ParsedItem[] {
  if (!rawInput || !rawInput.trim()) return [];

  const lines = rawInput.includes("\n")
    ? rawInput.split(/[\r\n]+/)
    : rawInput.split(/[,\n;\r]+/);

  const cleanFallback =
    fallbackIcon && fallbackIcon.trim() ? fallbackIcon.trim() : undefined;

  const results: ParsedItem[] = [];

  for (const line of lines) {
    let text = line.trim();
    if (!text) continue;

    // 1. Remove markdown checkboxes, numbered lists, or bullet points at the beginning
    text = text
      .replace(/^[\s\-*+]*\[[\s\u2713xX]*\]\s*/, "") // - [ ], - [x], * [ ]
      .replace(/^[\s\u2022\-*+0-9.)\]]+\s*/, "") // 1., 2), -, *, •
      .trim();

    if (!text) continue;

    let quantity: number | undefined = undefined;
    let locationNote: string | undefined = undefined;

    // 2. Extract inline location tag: e.g. "@ Desk" or "@ Front Pocket"
    const locationMatch = text.match(/(?:^|\s)@\s*([^@\(\)\[\]]+)$/);
    if (locationMatch && locationMatch[1]) {
      const loc = locationMatch[1].trim();
      if (loc) {
        locationNote = loc;
        text = text.substring(0, locationMatch.index).trim();
      }
    }

    // 3. Extract trailing quantity: e.g. "x2", "x 3", "(3)", "[2]"
    const qtyMatch = text.match(/(?:^|\s)(?:x\s*(\d+)|\((\d+)\)|\[(\d+)\])$/i);
    if (qtyMatch) {
      const numStr = qtyMatch[1] || qtyMatch[2] || qtyMatch[3];
      const parsedQty = parseInt(numStr, 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        quantity = parsedQty;
        text = text.substring(0, qtyMatch.index).trim();
      }
    }

    // 4. Secondary check for location note if quantity was placed after location
    if (!locationNote) {
      const locMatch2 = text.match(/(?:^|\s)@\s*([^@\(\)\[\]]+)$/);
      if (locMatch2 && locMatch2[1]) {
        const loc = locMatch2[1].trim();
        if (loc) {
          locationNote = loc;
          text = text.substring(0, locMatch2.index).trim();
        }
      }
    }

    const name = text.trim();
    if (!name) continue;

    const detected = detectIconForItem(name);
    const finalIcon =
      detected && detected !== "Tag"
        ? detected
        : cleanFallback || detected || "Tag";

    results.push({
      name,
      emoji: finalIcon,
      ...(quantity !== undefined && quantity > 1 ? { quantity } : {}),
      ...(locationNote ? { locationNote } : {}),
    });
  }

  return results;
}

export interface SharedRoutinePayload {
  name: string;
  icon?: string;
  items: Array<{
    name: string;
    emoji?: string;
    quantity?: number;
    locationNote?: string;
  }>;
}

/**
 * Safely encode a routine payload into a URL-safe Base64 string.
 * Supports Unicode strings without throwing DOMExceptions and avoids deprecated escape/unescape.
 */
export function encodeRoutinePayload(payload: SharedRoutinePayload): string {
  const jsonStr = JSON.stringify(payload);
  if (typeof TextEncoder !== "undefined") {
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return encodeURIComponent(btoa(encodeURIComponent(jsonStr)));
}

/**
 * Safely decode a routine payload from either URL-safe base64 or legacy formats.
 */
export function decodeRoutinePayload(
  encodedStr: string
): SharedRoutinePayload | null {
  if (!encodedStr) return null;
  const raw = decodeURIComponent(encodedStr).trim();

  // 1. Try URL-safe Base64 / Standard Base64 with TextDecoder
  try {
    let normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4 !== 0) {
      normalized += "=";
    }
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch {
    // 2. Fallback to legacy escape / unescape format
    try {
      // @ts-ignore
      const legacy = decodeURIComponent(escape(atob(raw)));
      return JSON.parse(legacy);
    } catch {
      return null;
    }
  }
}


