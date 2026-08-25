import { describe, it } from "node:test";
import assert from "node:assert/strict";

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
    keywords: ["medicine", "pill", "pills", "vitamins", "bandaid", "first aid", "obat"],
    icon: "Pill",
  },
  { keywords: ["camera", "gopro", "lens", "dslr"], icon: "Camera" },
  { keywords: ["shoes", "sneakers", "boots", "sandals", "sepatu"], icon: "Footprints" },
];

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

  // 2. Multi-word phrase or word-boundary match (prevents "wire" matching "wireless")
  for (const entry of KEYWORD_ICON_MAP) {
    for (const keyword of entry.keywords) {
      if (keyword.includes(" ")) {
        if (lower.includes(keyword)) return entry.icon;
      } else {
        const wordRegex = new RegExp(`(^|\\s|[^a-z0-9])${keyword}($|\\s|[^a-z0-9])`, "i");
        if (wordRegex.test(lower)) return entry.icon;
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

describe("Feature 10 & 16: Presets & 23 Keyword Auto-Detection Categories", () => {
  it("T1.10.3: Verifies all 23 distinct keyword categories detect the correct icon", () => {
    const categorySamples: Array<{ input: string; expected: string; catIndex: number }> = [
      { input: "MacBook Pro", expected: "Laptop", catIndex: 1 },
      { input: "Phone Charger", expected: "Plug", catIndex: 2 },
      { input: "USB-C Lightning Cable", expected: "Cable", catIndex: 3 },
      { input: "Logitech Mouse", expected: "Mouse", catIndex: 4 },
      { input: "AirPods Pro Gen 2", expected: "Headphones", catIndex: 5 },
      { input: "Leather Wallet", expected: "Wallet", catIndex: 6 },
      { input: "Hydroflask Tumbler", expected: "CupSoda", catIndex: 7 },
      { input: "Student ID Card", expected: "IdCard", catIndex: 8 },
      { input: "Spiral Notebook", expected: "BookOpen", catIndex: 9 },
      { input: "Passport & Visa", expected: "FileText", catIndex: 10 },
      { input: "Cotton T-Shirt", expected: "Shirt", catIndex: 11 },
      { input: "Toothbrush & Toothpaste", expected: "Sparkles", catIndex: 12 },
      { input: "Apartment Keys", expected: "Key", catIndex: 13 },
      { input: "iPhone 16 Smartphone", expected: "Smartphone", catIndex: 14 },
      { input: "N95 Face Mask", expected: "Shield", catIndex: 15 },
      { input: "Polarized Sunglasses", expected: "Glasses", catIndex: 16 },
      { input: "Apple Watch Ultra", expected: "Watch", catIndex: 17 },
      { input: "Folding Umbrella", expected: "Umbrella", catIndex: 18 },
      { input: "Gel Pen & Highlighter", expected: "Pen", catIndex: 19 },
      { input: "Gym Dumbbell Weights", expected: "Dumbbell", catIndex: 20 },
      { input: "Daily Multivitamin Pills", expected: "Pill", catIndex: 21 },
      { input: "Sony Mirrorless Camera", expected: "Camera", catIndex: 22 },
      { input: "Running Shoes Sneakers", expected: "Footprints", catIndex: 23 },
    ];

    assert.equal(KEYWORD_ICON_MAP.length, 23);
    for (const sample of categorySamples) {
      const detected = detectIconForItem(sample.input);
      assert.equal(
        detected,
        sample.expected,
        `Category ${sample.catIndex} '${sample.input}' expected '${sample.expected}' but got '${detected}'`
      );
    }
  });

  it("T2.07 - T2.08: Case insensitivity, whitespace trimming, and multilingual Indonesian synonyms", () => {
    assert.equal(detectIconForItem("   DOMPET   "), "Wallet");
    assert.equal(detectIconForItem("Kunci Rumah"), "Key");
    assert.equal(detectIconForItem("Baju Kaos"), "Shirt");
    assert.equal(detectIconForItem("Sepatu Olahraga"), "Footprints");
    assert.equal(detectIconForItem("Payung Lipat"), "Umbrella");
    assert.equal(detectIconForItem("Obat Sakit Kepala"), "Pill");
    assert.equal(detectIconForItem("Buku Catatan"), "BookOpen");
    assert.equal(detectIconForItem("Kacamata Hitam"), "Glasses");
  });

  it("T2.06 & T2.10: Single letter and unknown terms fallback safely to 'Tag'", () => {
    assert.equal(detectIconForItem(""), "Tag");
    assert.equal(detectIconForItem("   "), "Tag");
    assert.equal(detectIconForItem("a"), "Tag");
    assert.equal(detectIconForItem("x"), "Tag");
    assert.equal(detectIconForItem("quantum flux capacitor"), "Tag");
  });
});
