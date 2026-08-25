import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { InMemoryConvexDB } from "./crud_mutations_queries.test.ts";
import { parseMultiItemInput } from "./multi_item_parser.test.ts";
import { evaluateWeatherData } from "./weather_engine.test.ts";
import { computeDepartureIntelligence } from "./departure_intelligence.test.ts";
import { generateMarkdown, encodeSharePayload, decodeSharePayload } from "./export_import_codecs.test.ts";
import { MockElectronAPIEngine } from "./ipc_bridge_titlebar.test.ts";
import { AudioSynthesizerEngine } from "./audio_synthesizer.test.ts";
import { handleKeyboardNavigation, type NavigationState } from "./keyboard_theme_navigation.test.ts";

describe("Tier 4: End-to-End Real-World Scenarios Simulation", () => {
  it("Scenario 1 (T4.01 - T4.08): Daily Morning Student Departure Journey", async () => {
    const db = new InMemoryConvexDB();
    const synth = new AudioSynthesizerEngine();
    const ipc = new MockElectronAPIEngine();
    const userId = "student_alex";

    // 1. Student launches app & creates 'Kampus' routine from Smart Presets
    const { routineName, insertedIds } = await db.applyPreset(userId, {
      name: "Kampus",
      icon: "GraduationCap",
      items: [
        { name: "Laptop", emoji: "Laptop" },
        { name: "Laptop Charger", emoji: "Plug" },
        { name: "Mouse", emoji: "Mouse" },
        { name: "Earphones", emoji: "Headphones" },
        { name: "Wallet", emoji: "Wallet" },
        { name: "Water Bottle", emoji: "CupSoda" },
      ],
    });
    assert.equal(routineName, "Kampus");
    assert.equal(insertedIds.length, 6);

    // 2. Weather Engine checks Open-Meteo -> reports 70% rain probability
    const weather = evaluateWeatherData({
      precipitation_probability_max: [70],
      temperature_2m_max: [27],
      temperature_2m_min: [22],
      weather_code: [61],
    });
    assert.ok(weather);
    assert.equal(weather.isRainExpected, true);
    assert.equal(weather.suggestedItem?.name, "Umbrella");

    // 3. Student 1-clicks '+ Add to Checklist' for Umbrella
    const umbrellaId = await db.addItem(userId, {
      routine: "Kampus",
      name: weather.suggestedItem!.name,
      emoji: weather.suggestedItem!.emoji,
    });
    assert.ok(umbrellaId);

    // 4. Student physically packs items and toggles them
    let currentItems = await db.listItems(userId, "Kampus");
    assert.equal(currentItems.length, 7);

    // Pack 6 items
    for (let i = 0; i < 6; i++) {
      await db.toggleItem(userId, currentItems[i]._id, true);
      synth.playSound("check");
    }

    // 5. Inspect Departure Intelligence Banner
    currentItems = await db.listItems(userId, "Kampus");
    let intel = computeDepartureIntelligence("Kampus", currentItems);
    assert.ok(intel);
    assert.equal(intel.isAllPacked, false);
    assert.equal(intel.missingCount, 1);
    assert.equal(intel.headlineText, "You haven't packed Umbrella:");

    // 6. Student packs Umbrella directly from Banner (1-click quick-pack)
    await db.toggleItem(userId, umbrellaId, true);
    synth.playSound("finish"); // 100% completion chime

    currentItems = await db.listItems(userId, "Kampus");
    intel = computeDepartureIntelligence("Kampus", currentItems);
    assert.ok(intel);
    assert.equal(intel.isAllPacked, true);
    assert.equal(intel.headlineText, "Everything is packed and ready to go!");

    // 7. Student exports completed checklist to Markdown for daily journal
    const mdExport = generateMarkdown("Kampus", currentItems);
    assert.match(mdExport, /# PocketChecker — Kampus Checklist/);
    assert.match(mdExport, /- \[x\] Umbrella/);

    // 8. Student minimizes to system tray for commute
    await ipc.minimize();
    assert.equal(ipc.state.isMinimized, true);
  });

  it("Scenario 2 (T4.09 - T4.16): Business Executive Travel & Team Sharing Workflow", async () => {
    const db = new InMemoryConvexDB();
    const execId = "exec_sarah";
    const colleagueId = "colleague_bob";

    // 1. Executive creates Travel routine from preset
    await db.applyPreset(execId, {
      name: "Travel",
      icon: "Plane",
      items: [
        { name: "Passport", emoji: "FileText" },
        { name: "Wallet", emoji: "Wallet" },
        { name: "Charger", emoji: "Plug" },
        { name: "Clothes", emoji: "Shirt" },
        { name: "Toiletries", emoji: "Sparkles" },
      ],
    });

    // 2. Multi-item bulk quick-add with batch parser
    const bulkTokens = parseMultiItemInput(
      "Noise Cancelling Headphones, Boarding Pass, Travel Adapter"
    );
    assert.equal(bulkTokens.length, 3);
    await db.addItemsBatch(execId, "Travel", bulkTokens);

    // 3. Edit metadata on Travel Adapter (quantity: 2, location: Carry-on)
    const items = await db.listItems(execId, "Travel");
    const adapterItem = items.find((i) => i.name === "Travel Adapter")!;
    await db.editItem(execId, {
      id: adapterItem._id,
      name: "Travel Adapter",
      emoji: "Plug",
      quantity: 2,
      locationNote: "Front carry-on pocket",
    });

    // 4. Generate Base64 shareable link
    const currentItems = await db.listItems(execId, "Travel");
    const shareUrlParam = encodeSharePayload({
      name: "Travel",
      icon: "Plane",
      items: currentItems.map((i) => ({
        name: i.name,
        emoji: i.emoji,
        quantity: i.quantity,
        locationNote: i.locationNote,
      })),
    });

    // 5. Colleague receives and decodes share URL
    const decodedRoutine = decodeSharePayload(shareUrlParam);
    assert.ok(decodedRoutine);
    assert.equal(decodedRoutine.name, "Travel");
    assert.equal(decodedRoutine.items.length, 8);

    // 6. Colleague 1-click imports routine into their account
    const importResult = await db.applyPreset(colleagueId, {
      name: decodedRoutine.name,
      icon: decodedRoutine.icon,
      items: decodedRoutine.items,
    });
    assert.equal(importResult.insertedIds.length, 8);

    // 7. Colleague accidentally deletes Passport, triggers Undo toast restoration
    const colleagueItems = await db.listItems(colleagueId, "Travel");
    const passportItem = colleagueItems.find((i) => i.name === "Passport")!;
    const deletedSnapshot = await db.deleteItem(colleagueId, passportItem._id);
    assert.equal((await db.listItems(colleagueId, "Travel")).length, 7);

    // Undo restore
    await db.restoreItems(colleagueId, [deletedSnapshot]);
    assert.equal((await db.listItems(colleagueId, "Travel")).length, 8);
  });

  it("Scenario 3 (T4.17 - T4.23): Desktop Power-User Keyboard & System Tray Workflow", async () => {
    const ipc = new MockElectronAPIEngine();
    let trayActionDispatched = "";

    ipc.onTrayAction((action) => {
      trayActionDispatched = action;
    });

    // Tray action 'reset-today'
    ipc.dispatchTrayAction("reset-today");
    assert.equal(trayActionDispatched, "reset-today");

    // Keyboard state machine navigation
    let navState: NavigationState = {
      selectedIndex: 0,
      activeRoutineIndex: 0,
      totalItems: 4,
      totalRoutines: 3,
      theme: "dark",
      isInputFocused: false,
      quickAddFocused: false,
      resetConfirmationTriggered: false,
      toggledItemIndices: [],
    };

    // Cycle routines: '1' -> '2' -> '3'
    navState = handleKeyboardNavigation(navState, { key: "2" });
    assert.equal(navState.activeRoutineIndex, 1);
    navState = handleKeyboardNavigation(navState, { key: "3" });
    assert.equal(navState.activeRoutineIndex, 2);

    // Navigate down and toggle item
    navState = handleKeyboardNavigation(navState, { key: "j" });
    navState = handleKeyboardNavigation(navState, { key: " " });
    assert.deepEqual(navState.toggledItemIndices, [1]);

    // Theme toggle 'd'
    navState = handleKeyboardNavigation(navState, { key: "d" });
    assert.equal(navState.theme, "light");

    // Window maximize toggle
    const isMax = await ipc.maximize();
    assert.equal(isMax, true);
  });
});
