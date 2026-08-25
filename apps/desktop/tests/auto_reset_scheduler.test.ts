import { describe, it } from "node:test";
import assert from "node:assert/strict";

export interface ScheduledRoutine {
  id: string;
  name: string;
  autoResetTime?: string; // "HH:mm"
  autoResetDays?: number[]; // [1, 2, 3, 4, 5] (1 = Mon, 7 = Sun)
  lastResetDate?: string; // "YYYY-MM-DD"
}

export function validateResetTime(timeStr: string): boolean {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function evaluateAutoReset(
  routine: ScheduledRoutine,
  currentTimeStr: string, // "HH:mm"
  currentDayOfWeek: number, // 1 to 7
  currentDateStr: string // "YYYY-MM-DD"
): boolean {
  if (!routine.autoResetTime || !validateResetTime(routine.autoResetTime)) return false;
  if (!routine.autoResetDays || routine.autoResetDays.length === 0) return false;

  // Already reset today -> skip
  if (routine.lastResetDate === currentDateStr) return false;

  // Active on current day?
  if (!routine.autoResetDays.includes(currentDayOfWeek)) return false;

  // Current time reached or passed reset time?
  const [resetH, resetM] = routine.autoResetTime.split(":").map(Number);
  const [curH, curM] = currentTimeStr.split(":").map(Number);

  const resetMinutes = resetH * 60 + resetM;
  const curMinutes = curH * 60 + curM;

  return curMinutes >= resetMinutes;
}

describe("Feature 18: Auto-Reset Routine Scheduler Evaluator", () => {
  it("T1.18.1: Validates 24-hour HH:mm time format", () => {
    assert.equal(validateResetTime("00:00"), true);
    assert.equal(validateResetTime("06:30"), true);
    assert.equal(validateResetTime("23:59"), true);
    assert.equal(validateResetTime("24:00"), false);
    assert.equal(validateResetTime("12:60"), false);
    assert.equal(validateResetTime("invalid"), false);
    assert.equal(validateResetTime(""), false);
  });

  it("T1.18.3: Triggers auto-reset on matching active day and reached time", () => {
    const routine: ScheduledRoutine = {
      id: "r1",
      name: "Work",
      autoResetTime: "06:00",
      autoResetDays: [1, 2, 3, 4, 5], // Mon-Fri
      lastResetDate: "2026-08-24",
    };

    // Tuesday (Day 2) at 06:15 AM on 2026-08-25
    const shouldReset = evaluateAutoReset(routine, "06:15", 2, "2026-08-25");
    assert.equal(shouldReset, true);
  });

  it("T1.18.4 & T2.32: Prevents duplicate reset if already executed today", () => {
    const routine: ScheduledRoutine = {
      id: "r1",
      name: "Work",
      autoResetTime: "06:00",
      autoResetDays: [1, 2, 3, 4, 5],
      lastResetDate: "2026-08-25", // Already reset today
    };

    const shouldReset = evaluateAutoReset(routine, "07:00", 2, "2026-08-25");
    assert.equal(shouldReset, false);
  });

  it("T2.31: Does not trigger on inactive days of the week", () => {
    const routine: ScheduledRoutine = {
      id: "r1",
      name: "Work",
      autoResetTime: "06:00",
      autoResetDays: [1, 2, 3, 4, 5], // Weekdays only
    };

    // Sunday (Day 7)
    const shouldReset = evaluateAutoReset(routine, "08:00", 7, "2026-08-30");
    assert.equal(shouldReset, false);
  });
});
