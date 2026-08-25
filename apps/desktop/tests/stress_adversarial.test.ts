import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SMART_PRESETS,
  KEYWORD_ICON_MAP,
  detectIconForItem,
  parseMultiItemInput,
} from "../src/renderer/src/lib/presets.ts";

// Recreate departure intelligence logic as implemented in SmartIntelligenceBanner and tested in suite
export interface ItemData {
  _id: string;
  name: string;
  isPacked: boolean;
  emoji?: string;
}

export function computeDepartureIntelligence(routineName: string, items: ItemData[]) {
  if (items.length === 0) return null;

  const matchingPreset = SMART_PRESETS.find(
    (p) => p.name.toLowerCase() === routineName.toLowerCase()
  );

  const usualBringNames: string[] = matchingPreset
    ? matchingPreset.items.map((i) => i.name)
    : items.slice(0, 5).map((i) => i.name);

  const missingItems = items.filter((i) => !i.isPacked);
  const missingCount = missingItems.length;
  const isAllPacked = missingCount === 0;

  let headlineText = "";
  if (isAllPacked) {
    headlineText = "Everything is packed and ready to go!";
  } else if (missingCount === 1) {
    headlineText = `You haven't packed ${missingItems[0].name}:`;
  } else {
    headlineText = `You haven't packed ${missingCount} items:`;
  }

  return {
    usualBringNames,
    missingItems,
    missingCount,
    isAllPacked,
    headlineText,
  };
}

describe("ADVERSARIAL STRESS TEST 1: Live Multi-Item Batch Parser", () => {
  it("TC-P01: Handles diverse bullet symbols, indentation, and leading spaces", () => {
    const input = `  •  Laptop  \n\t-   Laptop Charger\n* Mouse\n  • Earphones\n  - Wallet  \n * Water Bottle `;
    const parsed = parseMultiItemInput(input);
    assert.equal(parsed.length, 6);
    assert.equal(parsed[0].name, "Laptop");
    assert.equal(parsed[0].emoji, "Laptop");
    assert.equal(parsed[1].name, "Laptop Charger");
    assert.equal(parsed[1].emoji, "Plug");
    assert.equal(parsed[2].name, "Mouse");
    assert.equal(parsed[2].emoji, "Mouse");
    assert.equal(parsed[3].name, "Earphones");
    assert.equal(parsed[3].emoji, "Headphones");
    assert.equal(parsed[4].name, "Wallet");
    assert.equal(parsed[4].emoji, "Wallet");
    assert.equal(parsed[5].name, "Water Bottle");
    assert.equal(parsed[5].emoji, "CupSoda");
  });

  it("TC-P02: Handles various numbering formats (1., 02., 3), [4], 5 -)", () => {
    const input = `1. Passport\n02. ID Card\n3) House Key\n[4] iPhone\n5 - Umbrella\n6. Water Bottle`;
    const parsed = parseMultiItemInput(input);
    assert.equal(parsed.length, 6);
    assert.equal(parsed[0].name, "Passport");
    assert.equal(parsed[0].emoji, "FileText");
    assert.equal(parsed[1].name, "ID Card");
    assert.equal(parsed[1].emoji, "IdCard");
    assert.equal(parsed[2].name, "House Key");
    assert.equal(parsed[2].emoji, "Key");
    assert.equal(parsed[3].name, "iPhone");
    assert.equal(parsed[3].emoji, "Smartphone");
    assert.equal(parsed[4].name, "Umbrella");
    assert.equal(parsed[4].emoji, "Umbrella");
  });

  it("TC-P03: Handles mixed delimiters (comma, semicolon, newline, crlf) in a single input", () => {
    const input = "Laptop, Charger; Keys\r\nWallet, Water Bottle; Passport\n\nShoes";
    const parsed = parseMultiItemInput(input);
    assert.equal(parsed.length, 7);
    assert.equal(parsed[0].name, "Laptop");
    assert.equal(parsed[1].name, "Charger");
    assert.equal(parsed[2].name, "Keys");
    assert.equal(parsed[3].name, "Wallet");
    assert.equal(parsed[4].name, "Water Bottle");
    assert.equal(parsed[5].name, "Passport");
    assert.equal(parsed[6].name, "Shoes");
  });

  it("TC-P04: Handles Unicode and multilingual item names", () => {
    const input = "Dompet Kulit, Kacamata Hitam, 钥匙 (Keys), Café Card, 水杯";
    const parsed = parseMultiItemInput(input);
    assert.equal(parsed.length, 5);
    assert.equal(parsed[0].name, "Dompet Kulit");
    assert.equal(parsed[0].emoji, "Wallet");
    assert.equal(parsed[1].name, "Kacamata Hitam");
    assert.equal(parsed[1].emoji, "Glasses");
    assert.equal(parsed[2].name, "钥匙 (Keys)");
    assert.equal(parsed[2].emoji, "Key");
    assert.equal(parsed[3].name, "Café Card");
    assert.equal(parsed[3].emoji, "IdCard");
    assert.equal(parsed[4].name, "水杯");
    assert.equal(parsed[4].emoji, "Tag"); // Unknown unicode falls back to Tag
  });

  it("TC-P05: Fallback icon is used only when detected icon is Tag", () => {
    const input = "MacBook Pro, Mystery Gadget, Passport, Alien Artifact";
    const parsed = parseMultiItemInput(input, "Rocket");
    assert.equal(parsed[0].name, "MacBook Pro");
    assert.equal(parsed[0].emoji, "Laptop"); // Overrides fallback with detected
    assert.equal(parsed[1].name, "Mystery Gadget");
    assert.equal(parsed[1].emoji, "Rocket"); // Uses fallback
    assert.equal(parsed[2].name, "Passport");
    assert.equal(parsed[2].emoji, "FileText"); // Overrides fallback with detected
    assert.equal(parsed[3].name, "Alien Artifact");
    assert.equal(parsed[3].emoji, "Rocket"); // Uses fallback
  });

  it("TC-P06: Handles extreme degenerate inputs (empty, whitespace, delimiter-only, long strings)", () => {
    assert.deepEqual(parseMultiItemInput(""), []);
    assert.deepEqual(parseMultiItemInput("      "), []);
    assert.deepEqual(parseMultiItemInput(",,,,;;;;;\n\n\r\n"), []);
    assert.deepEqual(parseMultiItemInput("--- ••• *** 1. 2. "), []);

    const longItem = "A".repeat(500);
    const parsedLong = parseMultiItemInput(`Laptop, ${longItem}`);
    assert.equal(parsedLong.length, 2);
    assert.equal(parsedLong[0].name, "Laptop");
    assert.equal(parsedLong[1].name, longItem);
    assert.equal(parsedLong[1].emoji, "Tag");
  });
});

describe("ADVERSARIAL STRESS TEST 2: Smart Icon Detector (23 Categories & Edge Cases)", () => {
  it("TC-I01: Verifies all 23 category mappings with primary and secondary keywords", () => {
    const testCases: Array<{ name: string; expected: string; cat: number }> = [
      // 1. Laptop
      { name: "laptop", expected: "Laptop", cat: 1 },
      { name: "macbook air", expected: "Laptop", cat: 1 },
      { name: "notebook computer", expected: "Laptop", cat: 1 },
      // 2. Plug (Charger)
      { name: "laptop charger", expected: "Plug", cat: 2 },
      { name: "phone charger", expected: "Plug", cat: 2 },
      { name: "magsafe power adapter", expected: "Plug", cat: 2 },
      { name: "charger", expected: "Plug", cat: 2 },
      // 3. Cable
      { name: "usb cable", expected: "Cable", cat: 3 },
      { name: "lightning cord", expected: "Cable", cat: 3 },
      { name: "usb", expected: "Cable", cat: 3 },
      // 4. Mouse
      { name: "wireless mouse", expected: "Mouse", cat: 4 },
      { name: "magic trackpad", expected: "Mouse", cat: 4 },
      // 5. Headphones
      { name: "earphones", expected: "Headphones", cat: 5 },
      { name: "airpods pro", expected: "Headphones", cat: 5 },
      { name: "tws earbuds", expected: "Headphones", cat: 5 },
      // 6. Wallet
      { name: "wallet", expected: "Wallet", cat: 6 },
      { name: "dompet kulit", expected: "Wallet", cat: 6 },
      { name: "money pouch", expected: "Wallet", cat: 6 },
      // 7. CupSoda
      { name: "water bottle", expected: "CupSoda", cat: 7 },
      { name: "hydroflask tumbler", expected: "CupSoda", cat: 7 },
      { name: "energy drink", expected: "CupSoda", cat: 7 },
      // 8. IdCard
      { name: "student id card", expected: "IdCard", cat: 8 },
      { name: "ktp", expected: "IdCard", cat: 8 },
      { name: "access badge", expected: "IdCard", cat: 8 },
      { name: "rfid keycard", expected: "IdCard", cat: 8 },
      // 9. BookOpen
      { name: "spiral notebook", expected: "BookOpen", cat: 9 },
      { name: "buku catatan", expected: "BookOpen", cat: 9 },
      { name: "diary journal", expected: "BookOpen", cat: 9 },
      // 10. FileText
      { name: "passport", expected: "FileText", cat: 10 },
      { name: "paspor indonesia", expected: "FileText", cat: 10 },
      { name: "boarding pass ticket", expected: "FileText", cat: 10 },
      // 11. Shirt
      { name: "cotton t-shirt", expected: "Shirt", cat: 11 },
      { name: "baju kemeja", expected: "Shirt", cat: 11 },
      { name: "winter jacket hoodie", expected: "Shirt", cat: 11 },
      // 12. Sparkles (Toiletries)
      { name: "toothbrush & toothpaste", expected: "Sparkles", cat: 12 },
      { name: "shampoo and soap", expected: "Sparkles", cat: 12 },
      { name: "sunscreen skincare", expected: "Sparkles", cat: 12 },
      // 13. Key
      { name: "house key", expected: "Key", cat: 13 },
      { name: "kunci mobil", expected: "Key", cat: 13 },
      { name: "keychain", expected: "Key", cat: 13 },
      // 14. Smartphone
      { name: "handphone hp", expected: "Smartphone", cat: 14 },
      { name: "iphone 16", expected: "Smartphone", cat: 14 },
      { name: "android phone", expected: "Smartphone", cat: 14 },
      // 15. Shield (Mask)
      { name: "facemask", expected: "Shield", cat: 15 },
      { name: "masker medis", expected: "Shield", cat: 15 },
      // 16. Glasses
      { name: "sunglasses", expected: "Glasses", cat: 16 },
      { name: "kacamata baca", expected: "Glasses", cat: 16 },
      // 17. Watch
      { name: "apple watch", expected: "Watch", cat: 17 },
      { name: "jam tangan", expected: "Watch", cat: 17 },
      // 18. Umbrella
      { name: "folding umbrella", expected: "Umbrella", cat: 18 },
      { name: "payung lipat", expected: "Umbrella", cat: 18 },
      { name: "raincoat", expected: "Umbrella", cat: 18 },
      // 19. Pen
      { name: "ballpoint pen", expected: "Pen", cat: 19 },
      { name: "pulpen hitam", expected: "Pen", cat: 19 },
      { name: "marker pencil", expected: "Pen", cat: 19 },
      // 20. Dumbbell
      { name: "gym towel", expected: "Dumbbell", cat: 20 },
      { name: "workout dumbbell", expected: "Dumbbell", cat: 20 },
      // 21. Pill
      { name: "multivitamin pills", expected: "Pill", cat: 21 },
      { name: "obat flu", expected: "Pill", cat: 21 },
      { name: "bandaid first aid", expected: "Pill", cat: 21 },
      // 22. Camera
      { name: "dslr camera", expected: "Camera", cat: 22 },
      { name: "gopro lens", expected: "Camera", cat: 22 },
      // 23. Footprints (Shoes)
      { name: "running shoes sneakers", expected: "Footprints", cat: 23 },
      { name: "sepatu boots", expected: "Footprints", cat: 23 },
      { name: "beach sandals", expected: "Footprints", cat: 23 },
    ];

    assert.equal(KEYWORD_ICON_MAP.length, 23);
    for (const tc of testCases) {
      const res = detectIconForItem(tc.name);
      assert.equal(res, tc.expected, `Item '${tc.name}' (Category ${tc.cat}) returned '${res}' instead of '${tc.expected}'`);
    }
  });

  it("TC-I02: Word-boundary precision prevents false positive substring captures", () => {
    // "wireless mouse" contains "wire", but should match "Mouse" because "wireless mouse" matches mouse first or avoids bare "wire"
    assert.equal(detectIconForItem("wireless mouse"), "Mouse");
    // "hotwire tool" has no standalone "wire" or "cable", but let's check:
    // "wire" with word boundary regex won't match inside "hotwire"
    assert.equal(detectIconForItem("hotwire"), "Tag");
    // "ear" is not in keywords, "earphone" is -> "ear" shouldn't match
    assert.equal(detectIconForItem("bear"), "Tag");
    // "bookstore" shouldn't match "book" if tokenized as single word
    assert.equal(detectIconForItem("bookstore"), "Tag");
  });

  it("TC-I03: Resilient against regex meta-characters in user input", () => {
    const metaInputs = [
      "item (with) [brackets] & {braces}",
      "regex .*+?^$|()[]{}\\",
      "100% Cotton (T-Shirt)",
      "+++Special+++ Keys ---",
      "*** Passport *** !!!",
    ];

    for (const input of metaInputs) {
      assert.doesNotThrow(() => {
        const icon = detectIconForItem(input);
        assert.ok(typeof icon === "string");
      });
    }

    assert.equal(detectIconForItem("100% Cotton (T-Shirt)"), "Shirt");
    assert.equal(detectIconForItem("+++Special+++ Keys ---"), "Key");
    assert.equal(detectIconForItem("*** Passport *** !!!"), "FileText");
  });
});

describe("ADVERSARIAL STRESS TEST 3: Smart Presets Initialization & De-duplication", () => {
  it("TC-PR01: All 5 Smart Presets have valid metadata and items", () => {
    assert.equal(SMART_PRESETS.length, 5);
    const expectedIds = ["kampus", "work", "travel", "tech", "photography"];
    const actualIds = SMART_PRESETS.map((p) => p.id);
    assert.deepEqual(actualIds, expectedIds);

    for (const preset of SMART_PRESETS) {
      assert.ok(preset.name.length > 0);
      assert.ok(preset.icon.length > 0);
      assert.ok(preset.description.length > 0);
      assert.ok(preset.items.length >= 5);
      for (const item of preset.items) {
        assert.ok(item.name.length > 0);
        assert.ok(item.emoji && item.emoji.length > 0);
      }
    }
  });

  it("TC-PR02: De-duplication logic when applying presets over existing routine items", () => {
    const existingItems = [
      { name: "Laptop", isPacked: true },
      { name: "laptop charger", isPacked: false },
      { name: "Custom Notebook", isPacked: false },
    ];
    const existingNames = new Set(existingItems.map((i) => i.name.toLowerCase().trim()));

    const kampusPreset = SMART_PRESETS.find((p) => p.id === "kampus")!;
    const itemsToAdd = kampusPreset.items.filter(
      (item) => item.name && !existingNames.has(item.name.toLowerCase().trim())
    );

    // "Laptop" and "Laptop Charger" should be filtered out
    const addedNames = itemsToAdd.map((i) => i.name);
    assert.equal(itemsToAdd.length, 4);
    assert.ok(!addedNames.includes("Laptop"));
    assert.ok(!addedNames.includes("Laptop Charger"));
    assert.ok(addedNames.includes("Mouse"));
    assert.ok(addedNames.includes("Earphones"));
    assert.ok(addedNames.includes("Wallet"));
    assert.ok(addedNames.includes("Water Bottle"));
  });
});

describe("ADVERSARIAL STRESS TEST 4: Departure Intelligence Calculation Logic", () => {
  it("TC-D01: Returns null when item list is completely empty", () => {
    assert.equal(computeDepartureIntelligence("Kampus", []), null);
    assert.equal(computeDepartureIntelligence("Work", []), null);
    assert.equal(computeDepartureIntelligence("Custom", []), null);
  });

  it("TC-D02: Computes correct intelligence for known routine preset with case insensitivity", () => {
    const items: ItemData[] = [
      { _id: "1", name: "Laptop", isPacked: true },
      { _id: "2", name: "Laptop Charger", isPacked: false },
      { _id: "3", name: "Mouse", isPacked: false },
      { _id: "4", name: "Extra Pen", isPacked: true },
    ];

    const intelUpper = computeDepartureIntelligence("KAMPUS", items);
    assert.ok(intelUpper);
    assert.equal(intelUpper.usualBringNames.length, 6);
    assert.equal(intelUpper.missingCount, 2);
    assert.equal(intelUpper.isAllPacked, false);
    assert.equal(intelUpper.headlineText, "You haven't packed 2 items:");
    assert.deepEqual(
      intelUpper.missingItems.map((i) => i.name),
      ["Laptop Charger", "Mouse"]
    );
  });

  it("TC-D03: Handles single missing item singular grammar", () => {
    const items: ItemData[] = [
      { _id: "1", name: "Passport", isPacked: true },
      { _id: "2", name: "Wallet", isPacked: false },
    ];

    const intel = computeDepartureIntelligence("Travel", items);
    assert.ok(intel);
    assert.equal(intel.missingCount, 1);
    assert.equal(intel.isAllPacked, false);
    assert.equal(intel.headlineText, "You haven't packed Wallet:");
  });

  it("TC-D04: Handles 100% all items packed celebration state", () => {
    const items: ItemData[] = [
      { _id: "1", name: "Laptop", isPacked: true },
      { _id: "2", name: "Charger", isPacked: true },
      { _id: "3", name: "ID Card", isPacked: true },
    ];

    const intel = computeDepartureIntelligence("Work", items);
    assert.ok(intel);
    assert.equal(intel.missingCount, 0);
    assert.equal(intel.isAllPacked, true);
    assert.equal(intel.headlineText, "Everything is packed and ready to go!");
    assert.equal(intel.missingItems.length, 0);
  });

  it("TC-D05: Custom routine falls back to first 5 items without error", () => {
    const items: ItemData[] = [
      { _id: "1", name: "Guitar", isPacked: false },
      { _id: "2", name: "Capo", isPacked: true },
      { _id: "3", name: "Picks", isPacked: false },
      { _id: "4", name: "Cable", isPacked: true },
      { _id: "5", name: "Amp", isPacked: false },
      { _id: "6", name: "Sheet Music", isPacked: false },
    ];

    const intel = computeDepartureIntelligence("Music Gig", items);
    assert.ok(intel);
    assert.equal(intel.usualBringNames.length, 5);
    assert.equal(intel.usualBringNames[0], "Guitar");
    assert.equal(intel.usualBringNames[4], "Amp");
    assert.equal(intel.missingCount, 4);
    assert.equal(intel.headlineText, "You haven't packed 4 items:");
  });
});
