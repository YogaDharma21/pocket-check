import test from "node:test"
import assert from "node:assert/strict"
import {
  extractImportParam,
  decodeRoutinePayload,
  parseRoutineFromUrl,
} from "../lib/import-routine.ts"

test("extractImportParam extracts import param from custom scheme", () => {
  const url = "pocketcheck://?import=testPayload123"
  assert.equal(extractImportParam(url), "testPayload123")
})

test("extractImportParam extracts import param from https link", () => {
  const url = "https://pocketchecker.my.id?import=testPayload456"
  assert.equal(extractImportParam(url), "testPayload456")
})

test("extractImportParam extracts data param fallback", () => {
  const url = "pocketcheck://import?data=testPayload789"
  assert.equal(extractImportParam(url), "testPayload789")
})

test("extractImportParam returns null when missing query param", () => {
  assert.equal(extractImportParam("pocketcheck://(main)"), null)
  assert.equal(extractImportParam(""), null)
  assert.equal(extractImportParam(null), null)
})

test("decodeRoutinePayload returns parsed routine object", () => {
  const payload = {
    name: "Gym Workout",
    icon: "barbell",
    items: [
      { name: "Towel", emoji: "towel", quantity: 1, locationNote: "Locker" },
      { name: "Water Bottle", emoji: "bottle", quantity: 2 },
    ],
  }
  const jsonStr = JSON.stringify(payload)
  const base64 = Buffer.from(
    unescape(encodeURIComponent(jsonStr)),
    "binary"
  ).toString("base64")
  const encodedParam = encodeURIComponent(base64)

  const result = decodeRoutinePayload(encodedParam)
  assert.ok(result)
  assert.equal(result.name, "Gym Workout")
  assert.equal(result.icon, "barbell")
  assert.equal(result.items.length, 2)
  assert.equal(result.items[0].name, "Towel")
  assert.equal(result.items[0].quantity, 1)
  assert.equal(result.items[0].locationNote, "Locker")
  assert.equal(result.items[1].name, "Water Bottle")
  assert.equal(result.items[1].quantity, 2)
})

test("decodeRoutinePayload handles invalid or malformed data gracefully", () => {
  assert.equal(decodeRoutinePayload(""), null)
  assert.equal(decodeRoutinePayload(null), null)
  assert.equal(decodeRoutinePayload("not-valid-base64!!!"), null)

  const invalidJsonBase64 = Buffer.from("invalid json").toString("base64")
  assert.equal(decodeRoutinePayload(invalidJsonBase64), null)

  const noNameBase64 = Buffer.from(
    JSON.stringify({ icon: "car", items: [] })
  ).toString("base64")
  assert.equal(decodeRoutinePayload(noNameBase64), null)
})

test("parseRoutineFromUrl parses valid deep link end to end", () => {
  const payload = {
    name: "Travel Pack",
    icon: "airplane",
    items: [{ name: "Passport", quantity: 1 }],
  }
  const jsonStr = JSON.stringify(payload)
  const base64 = Buffer.from(
    unescape(encodeURIComponent(jsonStr)),
    "binary"
  ).toString("base64")
  const url = `pocketcheck://?import=${encodeURIComponent(base64)}`

  const result = parseRoutineFromUrl(url)
  assert.ok(result)
  assert.equal(result.name, "Travel Pack")
  assert.equal(result.icon, "airplane")
  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].name, "Passport")
})
