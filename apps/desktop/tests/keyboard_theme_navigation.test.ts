import { describe, it } from "node:test";
import assert from "node:assert/strict";

export interface NavigationState {
  selectedIndex: number;
  activeRoutineIndex: number;
  totalItems: number;
  totalRoutines: number;
  theme: "dark" | "light";
  isInputFocused: boolean;
  quickAddFocused: boolean;
  resetConfirmationTriggered: boolean;
  toggledItemIndices: number[];
}

export function handleKeyboardNavigation(
  state: NavigationState,
  event: { key: string; shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
): NavigationState {
  const next = { ...state, toggledItemIndices: [...state.toggledItemIndices] };

  // If typing in input, suppress general navigation shortcuts
  if (state.isInputFocused) {
    if (event.key === "Escape") {
      next.isInputFocused = false;
    }
    return next;
  }

  // Quick-Add Shortcut (Ctrl+K or Cmd+K)
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    next.quickAddFocused = true;
    next.isInputFocused = true;
    return next;
  }

  // Theme Toggle ('d' or 'D')
  if (event.key.toLowerCase() === "d" && !event.ctrlKey && !event.metaKey) {
    next.theme = next.theme === "dark" ? "light" : "dark";
    return next;
  }

  // Reset Routine (Shift+U)
  if (event.shiftKey && event.key.toUpperCase() === "U") {
    next.resetConfirmationTriggered = true;
    return next;
  }

  // Routine Switcher (Digits 1-9)
  const digit = parseInt(event.key, 10);
  if (!isNaN(digit) && digit >= 1 && digit <= 9) {
    const targetRoutineIndex = digit - 1;
    if (targetRoutineIndex < state.totalRoutines) {
      next.activeRoutineIndex = targetRoutineIndex;
      next.selectedIndex = 0; // Reset item navigation index
    }
    return next;
  }

  // Item Navigation: J (down), K (up)
  if (event.key.toLowerCase() === "j") {
    if (state.selectedIndex < state.totalItems - 1) {
      next.selectedIndex += 1;
    }
    return next;
  }
  if (event.key.toLowerCase() === "k") {
    if (state.selectedIndex > 0) {
      next.selectedIndex -= 1;
    }
    return next;
  }

  // Item Toggle: Space
  if (event.key === " " || event.key === "Spacebar") {
    if (state.selectedIndex >= 0 && state.selectedIndex < state.totalItems) {
      next.toggledItemIndices.push(state.selectedIndex);
    }
    return next;
  }

  return next;
}

describe("Feature 6 & 13: Keyboard Navigation & Theme State Transitions", () => {
  const baseState: NavigationState = {
    selectedIndex: 0,
    activeRoutineIndex: 0,
    totalItems: 5,
    totalRoutines: 3,
    theme: "dark",
    isInputFocused: false,
    quickAddFocused: false,
    resetConfirmationTriggered: false,
    toggledItemIndices: [],
  };

  it("T1.13.1 - T1.13.2 & T2.45 - T2.46: J/K navigation and Space toggle with boundary clamping", () => {
    let s = { ...baseState };

    // Move down with J
    s = handleKeyboardNavigation(s, { key: "j" });
    assert.equal(s.selectedIndex, 1);

    s = handleKeyboardNavigation(s, { key: "j" });
    assert.equal(s.selectedIndex, 2);

    // Toggle item at index 2 with Space
    s = handleKeyboardNavigation(s, { key: " " });
    assert.deepEqual(s.toggledItemIndices, [2]);

    // Move up with K
    s = handleKeyboardNavigation(s, { key: "k" });
    assert.equal(s.selectedIndex, 1);

    // Boundary K at top index 0 does not go negative
    s = handleKeyboardNavigation(s, { key: "k" });
    s = handleKeyboardNavigation(s, { key: "k" });
    assert.equal(s.selectedIndex, 0);

    // Boundary J at bottom index 4 does not exceed totalItems - 1
    for (let i = 0; i < 10; i++) {
      s = handleKeyboardNavigation(s, { key: "j" });
    }
    assert.equal(s.selectedIndex, 4);
  });

  it("T1.13.3 & T2.44: Number keys 1-9 switch active routine tabs", () => {
    let s = { ...baseState, selectedIndex: 3 };
    
    // Switch to routine 2 (index 1)
    s = handleKeyboardNavigation(s, { key: "2" });
    assert.equal(s.activeRoutineIndex, 1);
    assert.equal(s.selectedIndex, 0); // Resets item index

    // Pressing 9 when totalRoutines is 3 is ignored
    s = handleKeyboardNavigation(s, { key: "9" });
    assert.equal(s.activeRoutineIndex, 1);
  });

  it("T1.6.3 & T1.13.4: 'D' key theme toggle and Shift+U reset trigger", () => {
    let s = { ...baseState };
    
    // Toggle theme
    s = handleKeyboardNavigation(s, { key: "d" });
    assert.equal(s.theme, "light");
    s = handleKeyboardNavigation(s, { key: "D" });
    assert.equal(s.theme, "dark");

    // Reset routine
    s = handleKeyboardNavigation(s, { key: "U", shiftKey: true });
    assert.equal(s.resetConfirmationTriggered, true);
  });

  it("T1.13.5: Keyboard shortcuts are suppressed when input is focused", () => {
    const s = { ...baseState, isInputFocused: true };
    const res = handleKeyboardNavigation(s, { key: "j" });
    assert.equal(res.selectedIndex, 0); // No navigation
  });
});
