export interface CompletionRecord {
  _id?: string;
  completedAt: number;
}

export interface DayCompletionStatus {
  dateStr: string;
  dayLabel: string;
  dayShort: string;
  dateFormatted: string;
  isToday: boolean;
  isCompleted: boolean;
  completedAtTimes: number[];
  tooltip: string;
}

export function formatCompletionTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function toLocalDateString(timestamp: number | Date): string {
  const d = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getRolling7DaysStatus(
  completions: CompletionRecord[],
  referenceDate: Date = new Date()
): DayCompletionStatus[] {
  const completionsByDate = new Map<string, number[]>();
  for (const c of completions) {
    const key = toLocalDateString(c.completedAt);
    const list = completionsByDate.get(key) ?? [];
    list.push(c.completedAt);
    completionsByDate.set(key, list);
  }

  const todayStr = toLocalDateString(referenceDate);
  const result: DayCompletionStatus[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dateStr = toLocalDateString(d);
    const isToday = dateStr === todayStr;

    const times = completionsByDate.get(dateStr) ?? [];
    const isCompleted = times.length > 0;

    const dayLabel = d.toLocaleDateString("en-US", { weekday: "narrow" });
    const dayShort = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateFormatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    let tooltip = `${dayShort}, ${dateFormatted}: Not completed`;
    if (isCompleted) {
      const latestTime = Math.max(...times);
      const timeStr = formatCompletionTime(latestTime);
      tooltip = isToday
        ? `Today (${timeStr}): 100% Packed`
        : `${dayShort}, ${dateFormatted} (${timeStr}): 100% Packed`;
    } else if (isToday) {
      tooltip = "Today: In progress";
    }

    result.push({
      dateStr,
      dayLabel,
      dayShort,
      dateFormatted,
      isToday,
      isCompleted,
      completedAtTimes: times,
      tooltip,
    });
  }

  return result;
}
