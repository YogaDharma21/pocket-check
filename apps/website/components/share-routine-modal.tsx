"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Check, Link as LinkIcon, Sparkles } from "lucide-react"

interface ShareRoutineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routineName: string
  routineIcon: string
  items: Array<{
    name: string
    emoji?: string
    quantity?: number
    locationNote?: string
  }>
}

export function ShareRoutineModal({
  open,
  onOpenChange,
  routineName,
  routineIcon,
  items,
}: ShareRoutineModalProps) {
  const [copied, setCopied] = React.useState(false)

  const shareUrl = React.useMemo(() => {
    if (typeof window === "undefined" || !open) return ""
    try {
      const payload = {
        name: routineName,
        icon: routineIcon,
        items: items.map((i) => ({
          name: i.name,
          emoji: i.emoji,
          quantity: i.quantity,
          locationNote: i.locationNote,
        })),
      }
      const encoded = encodeURIComponent(
        btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      )
      return `${window.location.origin}?import=${encoded}`
    } catch {
      return ""
    }
  }, [open, routineName, routineIcon, items])

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
            <Share2 className="h-4 w-4 text-purple-400" />
            Share {routineName} Routine
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Anyone with this link can preview and 1-click import this checklist into their PocketCheck account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-200">{routineName}</span>
              <span className="text-zinc-500">{items.length} items included</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {items.slice(0, 8).map((item, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center gap-1"
                >
                  <Sparkles className="h-2.5 w-2.5 text-zinc-400" />
                  {item.name}
                  {item.quantity && item.quantity > 1 ? ` (${item.quantity}x)` : ""}
                </span>
              ))}
              {items.length > 8 && (
                <span className="text-[11px] px-2 py-0.5 text-zinc-500">
                  +{items.length - 8} more
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Shareable Link
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={shareUrl}
                  readOnly
                  className="pl-8 bg-zinc-900 border-zinc-800 text-xs font-mono text-zinc-300 h-9 select-all"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-9 px-3 text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 font-bold"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8 text-zinc-300 border-zinc-800 hover:bg-zinc-900"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
