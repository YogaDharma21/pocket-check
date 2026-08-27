import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Calendar, Check, RotateCcw } from "lucide-react";

interface RoutineScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineName: string;
  initialTime?: string;
  initialDays?: number[];
  onSaveSchedule: (time?: string, days?: number[]) => Promise<void>;
}

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

function RoutineScheduleForm({
  routineName,
  initialTime,
  initialDays,
  onSaveSchedule,
  onCancel,
}: {
  routineName: string;
  initialTime?: string;
  initialDays?: number[];
  onSaveSchedule: (time?: string, days?: number[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [enabled, setEnabled] = React.useState(!!initialTime);
  const [time, setTime] = React.useState(initialTime || "06:00");
  const [selectedDays, setSelectedDays] = React.useState<number[]>(
    initialDays && initialDays.length > 0 ? initialDays : [1, 2, 3, 4, 5]
  );
  const [saving, setSaving] = React.useState(false);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (enabled) {
        await onSaveSchedule(time, selectedDays);
      } else {
        await onSaveSchedule(undefined, undefined);
      }
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-foreground" />
          Auto-Reset Schedule for {routineName}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Automatically uncheck all packed items at your chosen time so you wake up with a fresh checklist.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Toggle Enable */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-foreground block">
              Enable Daily Auto-Reset
            </label>
            <p className="text-[11px] text-muted-foreground">
              Reset checklist automatically on scheduled days
            </p>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded accent-primary cursor-pointer"
          />
        </div>

        {enabled && (
          <>
            {/* Reset Time */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Reset Time (Local Timezone)
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-muted/30 border-border text-sm font-bold text-foreground h-11 rounded-lg px-3 [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
              />
            </div>

            {/* Active Days */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Active Days
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((d) => {
                  const isSelected = selectedDays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`h-9 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-foreground text-background font-black border-transparent shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <DialogFooter className="flex flex-row items-center justify-between pt-3 border-t border-border mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground cursor-pointer font-bold"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={saving}
          className="text-xs h-9 px-4 bg-foreground text-background hover:bg-foreground/90 font-bold flex items-center gap-1.5 cursor-pointer rounded-lg"
          onClick={handleSave}
        >
          {saving ? (
            <RotateCcw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          )}
          Save Schedule
        </Button>
      </DialogFooter>
    </>
  );
}

export function RoutineScheduleModal({
  open,
  onOpenChange,
  routineName,
  initialTime,
  initialDays,
  onSaveSchedule,
}: RoutineScheduleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <RoutineScheduleForm
            key={`${routineName}-${initialTime || "none"}-${initialDays?.join(",") || "none"}`}
            routineName={routineName}
            initialTime={initialTime}
            initialDays={initialDays}
            onSaveSchedule={onSaveSchedule}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
