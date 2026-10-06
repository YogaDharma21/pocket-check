"use client"

import {
  Home,
  Plus,
  Sparkles,
  Download,
  Share2,
  Clock,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingNavbarProps {
  onHome: () => void
  onNewDestination: () => void
  onPresets: () => void
  onExport: () => void
  onShare: () => void
  onSchedule: () => void
  onAbout: () => void
  hasRoutine: boolean
}

export function FloatingNavbar({
  onHome,
  onNewDestination,
  onPresets,
  onExport,
  onShare,
  onSchedule,
  onAbout,
  hasRoutine,
}: FloatingNavbarProps) {
  const itemClass = (disabled?: boolean) =>
    cn(
      "group flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full transition-colors sm:h-auto sm:w-auto sm:gap-1 sm:rounded-xl sm:px-3 sm:py-2",
      disabled
        ? "cursor-not-allowed text-muted-foreground opacity-40"
        : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
    )

  const labelClass = "hidden text-[10px] font-black tracking-wider uppercase sm:block"

  return (
    <nav
      aria-label="Quick actions"
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 sm:bottom-6"
    >
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/90 p-1.5 shadow-lg backdrop-blur-md sm:gap-0.5 sm:rounded-2xl sm:px-2">
        <button
          type="button"
          onClick={onHome}
          title="Back to checklist top"
          aria-label="Back to checklist top"
          className={itemClass()}
        >
          <Home className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className={labelClass}>Home</span>
        </button>

        <button
          type="button"
          onClick={onNewDestination}
          title="Create new destination"
          aria-label="Create new destination"
          className={itemClass()}
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className={labelClass}>New Dest</span>
        </button>

        <button
          type="button"
          onClick={onPresets}
          title="Browse smart presets"
          aria-label="Browse smart presets"
          className={itemClass()}
        >
          <Sparkles className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className={labelClass}>Presets</span>
        </button>

        <div className="mx-0.5 h-6 w-px bg-border" aria-hidden="true" />

        <button
          type="button"
          onClick={onExport}
          disabled={!hasRoutine}
          title="Export checklist"
          aria-label="Export checklist"
          className={itemClass(!hasRoutine)}
        >
          <Download className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className={labelClass}>Export</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          disabled={!hasRoutine}
          title="Share routine"
          aria-label="Share routine"
          className={itemClass(!hasRoutine)}
        >
          <Share2 className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className={labelClass}>Share</span>
        </button>

        <button
          type="button"
          onClick={onSchedule}
          disabled={!hasRoutine}
          title="Schedule auto-reset"
          aria-label="Schedule auto-reset"
          className={itemClass(!hasRoutine)}
        >
          <Clock className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className={labelClass}>Schedule</span>
        </button>

        <div className="mx-0.5 h-6 w-px bg-border" aria-hidden="true" />

        <button
          type="button"
          onClick={onAbout}
          title="About PocketChecker"
          aria-label="About PocketChecker"
          className={itemClass()}
        >
          <Info className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className={labelClass}>About</span>
        </button>
      </div>
    </nav>
  )
}
