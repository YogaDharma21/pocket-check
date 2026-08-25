import { describe, it } from "node:test";
import assert from "node:assert/strict";

export interface ItemData {
  _id: string;
  name: string;
  isPacked: boolean;
  emoji?: string;
}

export const SMART_PRESETS = [
  {
    name: "Kampus",
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
    name: "Work",
    items: [
      { name: "Laptop", emoji: "Laptop" },
      { name: "Charger", emoji: "Plug" },
      { name: "ID Card", emoji: "IdCard" },
      { name: "Notebook", emoji: "BookOpen" },
      { name: "Wallet", emoji: "Wallet" },
    ],
  },
  {
    name: "Travel",
    items: [
      { name: "Passport", emoji: "FileText" },
      { name: "Wallet", emoji: "Wallet" },
      { name: "Charger", emoji: "Plug" },
      { name: "Clothes", emoji: "Shirt" },
      { name: "Toiletries", emoji: "Sparkles" },
    ],
  },
];

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

describe("Feature 14: Departure Intelligence Calculator", () => {
  it("T1.14.1: Matches SMART_PRESETS for known routine 'Kampus'", () => {
    const items: ItemData[] = [
      { _id: "1", name: "Laptop", isPacked: true },
      { _id: "2", name: "Laptop Charger", isPacked: false },
      { _id: "3", name: "Extra Snack", isPacked: false },
    ];
    const intel = computeDepartureIntelligence("Kampus", items);
    assert.ok(intel);
    assert.equal(intel.usualBringNames.length, 6);
    assert.equal(intel.usualBringNames[0], "Laptop");
    assert.equal(intel.missingCount, 2);
    assert.equal(intel.headlineText, "You haven't packed 2 items:");
  });

  it("T1.14.2: Falls back to items.slice(0, 5) for custom routine", () => {
    const items: ItemData[] = [
      { _id: "1", name: "Tent", isPacked: false },
      { _id: "2", name: "Sleeping Bag", isPacked: false },
      { _id: "3", name: "Stove", isPacked: false },
      { _id: "4", name: "Flashlight", isPacked: false },
      { _id: "5", name: "Compass", isPacked: false },
      { _id: "6", name: "Map", isPacked: false },
    ];
    const intel = computeDepartureIntelligence("Weekend Camping", items);
    assert.ok(intel);
    assert.equal(intel.usualBringNames.length, 5);
    assert.equal(intel.usualBringNames[0], "Tent");
    assert.equal(intel.usualBringNames[4], "Compass");
  });

  it("T1.14.3 & T2.20 - T2.22: All packed vs single remaining item headline states", () => {
    // 1 item remaining
    const singleMissing: ItemData[] = [
      { _id: "1", name: "Passport", isPacked: false },
      { _id: "2", name: "Wallet", isPacked: true },
    ];
    const intelSingle = computeDepartureIntelligence("Travel", singleMissing);
    assert.ok(intelSingle);
    assert.equal(intelSingle.isAllPacked, false);
    assert.equal(intelSingle.missingCount, 1);
    assert.equal(intelSingle.headlineText, "You haven't packed Passport:");

    // All items packed
    const allPacked: ItemData[] = [
      { _id: "1", name: "Passport", isPacked: true },
      { _id: "2", name: "Wallet", isPacked: true },
    ];
    const intelAll = computeDepartureIntelligence("Travel", allPacked);
    assert.ok(intelAll);
    assert.equal(intelAll.isAllPacked, true);
    assert.equal(intelAll.missingCount, 0);
    assert.equal(intelAll.headlineText, "Everything is packed and ready to go!");
  });

  it("T2.19: Returns null on empty item list", () => {
    assert.equal(computeDepartureIntelligence("Work", []), null);
  });
});
