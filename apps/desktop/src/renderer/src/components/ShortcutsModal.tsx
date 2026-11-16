import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { key: "Space", desc: "Toggle focused or next missing item" },
  { key: "J / ↓", desc: "Navigate down through checklist" },
  { key: "K / ↑", desc: "Navigate up through checklist" },
  { key: "Ctrl + K", desc: "Focus quick add item input" },
  { key: "Shift + U", desc: "Uncheck all items in active destination" },
  { key: "1 - 9", desc: "Switch to destination by number" },
  { key: "D", desc: "Toggle dark / light appearance mode" },
  { key: "?", desc: "Open this keyboard shortcuts cheat sheet" },
  { key: "Esc", desc: "Close open dialog or dismiss focus" },
];

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
              <Keyboard className="w-4 h-4" />
            </div>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Quickly manage your checklist without leaving the keyboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <span className="text-xs text-muted-foreground">{shortcut.desc}</span>
              <kbd className="px-2 py-1 bg-surface-inset border border-border rounded font-mono text-[11px] font-semibold text-foreground tabular-nums shadow-xs">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
