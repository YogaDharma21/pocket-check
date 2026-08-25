import { describe, it } from "node:test";
import assert from "node:assert/strict";

export interface ExportItem {
  name: string;
  isPacked: boolean;
  emoji?: string;
  quantity?: number;
  locationNote?: string;
}

export function generateMarkdown(routineName: string, items: ExportItem[], dateStr: string = "2026-08-25"): string {
  let md = `# PocketChecker — ${routineName} Checklist\n\n`;
  md += `*Exported on ${dateStr}*\n\n`;
  items.forEach((item) => {
    const check = item.isPacked ? "[x]" : "[ ]";
    const qty = item.quantity && item.quantity > 1 ? ` (${item.quantity}x)` : "";
    const note = item.locationNote ? ` — *${item.locationNote}*` : "";
    md += `- ${check} ${item.name}${qty}${note}\n`;
  });
  return md;
}

export function generateJSON(routineName: string, items: ExportItem[], exportedAt: string = "2026-08-25T00:00:00.000Z"): string {
  return JSON.stringify(
    {
      routine: routineName,
      exportedAt,
      items: items.map((i) => ({
        name: i.name,
        isPacked: i.isPacked,
        emoji: i.emoji,
        quantity: i.quantity,
        locationNote: i.locationNote,
      })),
    },
    null,
    2
  );
}

export function encodeSharePayload(payload: {
  name: string;
  icon: string;
  items: Array<{ name: string; emoji?: string; quantity?: number; locationNote?: string }>;
}): string {
  const json = JSON.stringify(payload);
  return encodeURIComponent(
    Buffer.from(json, "utf8").toString("base64")
  );
}

export function decodeSharePayload(encodedParam: string): {
  name: string;
  icon: string;
  items: Array<{ name: string; emoji?: string; quantity?: number; locationNote?: string }>;
} | null {
  if (!encodedParam || !encodedParam.trim()) return null;
  try {
    const decodedUri = decodeURIComponent(encodedParam);
    const json = Buffer.from(decodedUri, "base64").toString("utf8");
    const data = JSON.parse(json);
    if (!data || typeof data.name !== "string" || !Array.isArray(data.items)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

describe("Feature 19 & 20: Export Markdown/JSON & Base64 Share/Import Codecs", () => {
  const sampleItems: ExportItem[] = [
    { name: "Laptop", isPacked: true, emoji: "Laptop" },
    { name: "USB Cable", isPacked: false, emoji: "Cable", quantity: 3, locationNote: "Front pouch" },
    { name: "Notebook", isPacked: false, emoji: "BookOpen" },
  ];

  it("T1.19.1 - T1.19.2: Markdown export accurately formats headers, quantities (>1), and location notes", () => {
    const md = generateMarkdown("Work", sampleItems, "8/25/2026");
    assert.match(md, /^# PocketChecker — Work Checklist\n\n\*Exported on 8\/25\/2026\*\n\n/);
    assert.match(md, /- \[x\] Laptop\n/);
    assert.match(md, /- \[ \] USB Cable \(3x\) — \*Front pouch\*\n/);
    assert.match(md, /- \[ \] Notebook\n/);
  });

  it("T1.19.3: JSON export generates valid JSON adhering to schema", () => {
    const jsonStr = generateJSON("Work", sampleItems);
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.routine, "Work");
    assert.equal(parsed.items.length, 3);
    assert.equal(parsed.items[0].name, "Laptop");
    assert.equal(parsed.items[0].isPacked, true);
    assert.equal(parsed.items[1].quantity, 3);
  });

  it("T1.20.1 - T1.20.3 & T2.29: Base64 URL parameter encoding & decoding with unicode preservation", () => {
    const payload = {
      name: "Liburan Bali 🌴",
      icon: "Plane",
      items: [
        { name: "Paspor & Tiket ✈️", emoji: "FileText" },
        { name: "Kamera DSLR", emoji: "Camera", quantity: 2, locationNote: "Tas Kamera" },
      ],
    };

    const encoded = encodeSharePayload(payload);
    assert.ok(encoded.length > 0);

    const decoded = decodeSharePayload(encoded);
    assert.ok(decoded);
    assert.equal(decoded.name, "Liburan Bali 🌴");
    assert.equal(decoded.icon, "Plane");
    assert.equal(decoded.items.length, 2);
    assert.equal(decoded.items[0].name, "Paspor & Tiket ✈️");
    assert.equal(decoded.items[1].quantity, 2);
    assert.equal(decoded.items[1].locationNote, "Tas Kamera");
  });

  it("T2.26 - T2.28: Gracefully handles empty string, malformed base64, and non-conforming JSON payload", () => {
    assert.equal(decodeSharePayload(""), null);
    assert.equal(decodeSharePayload("   "), null);
    assert.equal(decodeSharePayload("!@#invalid-base64$%^"), null);
    
    // Valid Base64 but invalid object schema (missing items)
    const invalidObjB64 = Buffer.from(JSON.stringify({ name: "Work" }), "utf8").toString("base64");
    assert.equal(decodeSharePayload(invalidObjB64), null);
  });
});
