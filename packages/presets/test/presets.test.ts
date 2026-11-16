import test from "node:test";
import assert from "node:assert/strict";
import {
  parseMultiItemInput,
  detectIconForItem,
  encodeRoutinePayload,
  decodeRoutinePayload,
} from "../src/index.ts";

test("parseMultiItemInput handles simple comma and newline separation", () => {
  const input = "Laptop, Charger, Wallet";
  const items = parseMultiItemInput(input);
  assert.equal(items.length, 3);
  assert.equal(items[0].name, "Laptop");
  assert.equal(items[0].emoji, "Laptop");
  assert.equal(items[1].name, "Charger");
  assert.equal(items[1].emoji, "Plug");
  assert.equal(items[2].name, "Wallet");
  assert.equal(items[2].emoji, "Wallet");
});

test("parseMultiItemInput strips markdown checkboxes and numbered lists", () => {
  const input = `
- [ ] Laptop
- [x] Mouse
* [ ] Passport
1. Water Bottle
2) Keys
`;
  const items = parseMultiItemInput(input);
  assert.equal(items.length, 5);
  assert.equal(items[0].name, "Laptop");
  assert.equal(items[1].name, "Mouse");
  assert.equal(items[2].name, "Passport");
  assert.equal(items[3].name, "Water Bottle");
  assert.equal(items[4].name, "Keys");
});

test("parseMultiItemInput parses quantities and location notes", () => {
  const input = `
- [ ] USB Cable x3 @ Desk Drawer
- [ ] Socks (2) @ Main Bag
- [ ] Pen [4] @ Pencil Case
- [ ] Passport @ Front Pocket
`;
  const items = parseMultiItemInput(input);
  assert.equal(items.length, 4);

  assert.equal(items[0].name, "USB Cable");
  assert.equal(items[0].quantity, 3);
  assert.equal(items[0].locationNote, "Desk Drawer");

  assert.equal(items[1].name, "Socks");
  assert.equal(items[1].quantity, 2);
  assert.equal(items[1].locationNote, "Main Bag");

  assert.equal(items[2].name, "Pen");
  assert.equal(items[2].quantity, 4);
  assert.equal(items[2].locationNote, "Pencil Case");

  assert.equal(items[3].name, "Passport");
  assert.equal(items[3].quantity, undefined);
  assert.equal(items[3].locationNote, "Front Pocket");
});

test("encodeRoutinePayload and decodeRoutinePayload roundtrip with Unicode", () => {
  const payload = {
    name: "Tokyo Trip ✈️",
    icon: "Plane",
    items: [
      { name: "Passport 🛂", emoji: "FileText", quantity: 1, locationNote: "Jacket" },
      { name: "Yen Cash 💴", emoji: "Wallet", quantity: 2 },
    ],
  };

  const encoded = encodeRoutinePayload(payload);
  assert.ok(encoded.length > 0);
  assert.equal(encoded.includes("+"), false);
  assert.equal(encoded.includes("/"), false);

  const decoded = decodeRoutinePayload(encoded);
  assert.ok(decoded);
  assert.equal(decoded.name, "Tokyo Trip ✈️");
  assert.equal(decoded.items.length, 2);
  assert.equal(decoded.items[0].name, "Passport 🛂");
  assert.equal(decoded.items[0].locationNote, "Jacket");
});

