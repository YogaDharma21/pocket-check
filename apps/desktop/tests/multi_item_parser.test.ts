import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectIconForItem } from "./presets_keywords_detector.test.ts";

export function parseMultiItemInput(
  rawInput: string,
  fallbackIcon?: string
): Array<{ name: string; emoji?: string }> {
  if (!rawInput || !rawInput.trim()) return [];

  const rawTokens = rawInput
    .split(/[,\n;\r]+/)
    .map((token) =>
      token
        .replace(/^[\s•\-*0-9.)[\]]+/, "") // Strip bullets or numbers
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

describe("Feature 10: Multi-Item Parser with Bullet/Number Stripping", () => {
  it("T1.10.4: Splits comma-separated items and detects icons", () => {
    const parsed = parseMultiItemInput("USB Cable, Notebook, ID Card");
    assert.equal(parsed.length, 3);
    assert.deepEqual(parsed, [
      { name: "USB Cable", emoji: "Cable" },
      { name: "Notebook", emoji: "BookOpen" },
      { name: "ID Card", emoji: "IdCard" },
    ]);
  });

  it("T2.02: Strips bullet characters (-, •, *) from multi-line text", () => {
    const input = `- Laptop\n• Laptop Charger\n* Wireless Mouse`;
    const parsed = parseMultiItemInput(input);
    assert.equal(parsed.length, 3);
    assert.equal(parsed[0].name, "Laptop");
    assert.equal(parsed[0].emoji, "Laptop");
    assert.equal(parsed[1].name, "Laptop Charger");
    assert.equal(parsed[1].emoji, "Plug");
    assert.equal(parsed[2].name, "Wireless Mouse");
    assert.equal(parsed[2].emoji, "Mouse");
  });

  it("T2.03: Strips numbering prefixes (1., 2), [3]) correctly", () => {
    const input = `1. Passport\n2) Wallet\n[3] House Key`;
    const parsed = parseMultiItemInput(input);
    assert.equal(parsed.length, 3);
    assert.equal(parsed[0].name, "Passport");
    assert.equal(parsed[0].emoji, "FileText");
    assert.equal(parsed[1].name, "Wallet");
    assert.equal(parsed[1].emoji, "Wallet");
    assert.equal(parsed[2].name, "House Key");
    assert.equal(parsed[2].emoji, "Key");
  });

  it("T2.04 - T2.05: Handles mixed delimiters, trailing commas, and empty lines", () => {
    const input = `Laptop, Charger; Keys\n\nWallet, ,`;
    const parsed = parseMultiItemInput(input);
    assert.equal(parsed.length, 4);
    assert.equal(parsed[0].name, "Laptop");
    assert.equal(parsed[1].name, "Charger");
    assert.equal(parsed[2].name, "Keys");
    assert.equal(parsed[3].name, "Wallet");
  });

  it("T1.10.5: Uses custom fallback icon when keyword auto-detection yields 'Tag'", () => {
    const parsed = parseMultiItemInput("Quantum Widget, Space Helmet", "Rocket");
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].name, "Quantum Widget");
    assert.equal(parsed[0].emoji, "Rocket");
    assert.equal(parsed[1].name, "Space Helmet");
    assert.equal(parsed[1].emoji, "Rocket");
  });

  it("T2.01: Returns empty array on empty or whitespace-only inputs", () => {
    assert.deepEqual(parseMultiItemInput(""), []);
    assert.deepEqual(parseMultiItemInput("   "), []);
    assert.deepEqual(parseMultiItemInput(",,\n;\r"), []);
  });
});
