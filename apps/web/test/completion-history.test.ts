import test from "node:test";
import assert from "node:assert/strict";
import {
  toLocalDateString,
  getRolling7DaysStatus,
} from "../lib/completion-history.ts";

test("toLocalDateString formats YYYY-MM-DD correctly", () => {
  const d = new Date(2026, 9, 28, 10, 30, 0); // Month is 0-indexed (9 = Oct)
  assert.equal(toLocalDateString(d), "2026-10-28");
});

test("getRolling7DaysStatus generates exactly 7 days ending today", () => {
  const refDate = new Date(2026, 9, 28, 12, 0, 0);
  const status = getRolling7DaysStatus([], refDate);

  assert.equal(status.length, 7);
  assert.equal(status[6].isToday, true);
  assert.equal(status[6].dateStr, "2026-10-28");
  assert.equal(status[0].isToday, false);
  assert.equal(status[0].dateStr, "2026-10-22");
  assert.equal(status.every((s) => !s.isCompleted), true);
});

test("getRolling7DaysStatus correctly marks completed days with tooltips", () => {
  const refDate = new Date(2026, 9, 28, 12, 0, 0);
  const todayTimestamp = new Date(2026, 9, 28, 8, 30, 0).getTime();
  const twoDaysAgoTimestamp = new Date(2026, 9, 26, 9, 15, 0).getTime();

  const completions = [
    { completedAt: todayTimestamp },
    { completedAt: twoDaysAgoTimestamp },
  ];

  const status = getRolling7DaysStatus(completions, refDate);

  // Today (index 6)
  assert.equal(status[6].isToday, true);
  assert.equal(status[6].isCompleted, true);
  assert.match(status[6].tooltip, /Today.*100% Packed/);

  // Yesterday (index 5)
  assert.equal(status[5].isCompleted, false);
  assert.match(status[5].tooltip, /Not completed/);

  // 2 days ago (index 4 - Oct 26)
  assert.equal(status[4].dateStr, "2026-10-26");
  assert.equal(status[4].isCompleted, true);
  assert.match(status[4].tooltip, /100% Packed/);
});
