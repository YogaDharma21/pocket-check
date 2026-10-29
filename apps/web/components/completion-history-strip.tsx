"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@pocket-check/convex";
import { getRolling7DaysStatus } from "@/lib/completion-history";
import { cn } from "@/lib/utils";

interface CompletionHistoryStripProps {
  routine: string;
  className?: string;
  compact?: boolean;
}

export function CompletionHistoryStrip({
  routine,
  className,
  compact = false,
}: CompletionHistoryStripProps) {
  const rawCompletions = useQuery(
    api.pocketcheck.listRecentCompletions,
    routine ? { routine, days: 7 } : "skip"
  );

  const completions = useMemo(
    () => rawCompletions ?? [],
    [rawCompletions]
  );

  const days = useMemo(() => {
    return getRolling7DaysStatus(completions);
  }, [completions]);

  if (!routine) return null;

  return (
    <div
      role="region"
      aria-label={`7-day completion history for ${routine}`}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2 py-1 select-none shadow-xs sm:gap-2 sm:px-2.5",
        className
      )}
    >
      <span className="hidden text-[10px] font-semibold tracking-wider text-muted-foreground uppercase lg:inline-block">
        7D
      </span>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {days.map((day) => (
          <div
            key={day.dateStr}
            title={day.tooltip}
            className="group relative flex flex-col items-center gap-0.5 cursor-help"
          >
            {!compact && (
              <span
                className={cn(
                  "text-[9px] font-medium leading-none tabular-nums",
                  day.isToday
                    ? "font-bold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {day.dayLabel}
              </span>
            )}
            <span
              className={cn(
                "h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 transition-colors",
                day.isCompleted
                  ? "bg-emerald-600 dark:bg-emerald-500 shadow-xs"
                  : "bg-muted-foreground/20 border border-border/50",
                day.isToday && !day.isCompleted && "ring-1 ring-primary/60",
                day.isToday && day.isCompleted && "ring-2 ring-emerald-500/30"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
