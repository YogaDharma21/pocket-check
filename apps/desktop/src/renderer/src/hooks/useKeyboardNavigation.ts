import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface UseKeyboardNavigationProps {
  totalItems: number;
  totalRoutines: number;
  focusedIndex: number;
  setFocusedIndex: (index: number | ((prev: number) => number)) => void;
  onToggleItem: (index: number) => void;
  onSelectRoutineIndex: (index: number) => void;
  onResetRoutine: () => void;
  onFocusQuickAdd: () => void;
  isModalOpen?: boolean;
}

export function useKeyboardNavigation({
  totalItems,
  totalRoutines,
  focusedIndex,
  setFocusedIndex,
  onToggleItem,
  onSelectRoutineIndex,
  onResetRoutine,
  onFocusQuickAdd,
  isModalOpen = false,
}: UseKeyboardNavigationProps) {
  const { toggleTheme } = useTheme();

  // Keep latest callbacks in refs to avoid stale closures in event listeners
  const propsRef = useRef({
    totalItems,
    totalRoutines,
    focusedIndex,
    setFocusedIndex,
    onToggleItem,
    onSelectRoutineIndex,
    onResetRoutine,
    onFocusQuickAdd,
    isModalOpen,
    toggleTheme,
  });

  propsRef.current = {
    totalItems,
    totalRoutines,
    focusedIndex,
    setFocusedIndex,
    onToggleItem,
    onSelectRoutineIndex,
    onResetRoutine,
    onFocusQuickAdd,
    isModalOpen,
    toggleTheme,
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        totalItems,
        totalRoutines,
        focusedIndex,
        setFocusedIndex,
        onToggleItem,
        onSelectRoutineIndex,
        onResetRoutine,
        onFocusQuickAdd,
        isModalOpen,
        toggleTheme,
      } = propsRef.current;

      // Disable during open modals
      if (isModalOpen) return;

      const target = event.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Shortcut: Ctrl+K or Cmd+K to focus Quick Add
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onFocusQuickAdd();
        return;
      }

      // If user is inside an input, do not capture single-key hotkeys
      if (isInput) {
        if (event.key === "Escape") {
          target.blur();
        }
        return;
      }

      // Theme toggle: 'd' or 'D'
      if (event.key.toLowerCase() === "d" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        toggleTheme();
        return;
      }

      // Reset routine: Shift+U
      if (event.shiftKey && event.key.toUpperCase() === "U") {
        event.preventDefault();
        onResetRoutine();
        return;
      }

      // Number keys 1-9 to switch routine tabs
      const digit = parseInt(event.key, 10);
      if (!isNaN(digit) && digit >= 1 && digit <= 9 && !event.ctrlKey && !event.metaKey) {
        const targetIndex = digit - 1;
        if (targetIndex < totalRoutines) {
          event.preventDefault();
          onSelectRoutineIndex(targetIndex);
          setFocusedIndex(0);
        }
        return;
      }

      // Navigate down: 'j' or ArrowDown
      if (event.key.toLowerCase() === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        return;
      }

      // Navigate up: 'k' or ArrowUp
      if (event.key.toLowerCase() === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      // Spacebar to toggle focused item
      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < totalItems) {
          onToggleItem(focusedIndex);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
