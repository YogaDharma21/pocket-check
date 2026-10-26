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
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Share2 className="h-4 w-4" />
            Share {routineName} Routine
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Anyone with this link can preview and 1-click import this checklist
            into their PocketChecker account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2 rounded-lg border border-border bg-muted/60 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">{routineName}</span>
              <span className="text-muted-foreground">
                {items.length} items included
              </span>
            </div>
            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
              {items.slice(0, 8).map((item, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 rounded border border-border bg-card px-2 py-0.5 text-[11px] text-foreground"
                >
                  <Sparkles className="h-2.5 w-2.5 text-muted-foreground" />
                  {item.name}
                  {item.quantity && item.quantity > 1
                    ? ` (${item.quantity}x)`
                    : ""}
                </span>
              ))}
              {items.length > 8 && (
                <span className="px-2 py-0.5 text-[11px] text-muted-foreground">
                  +{items.length - 8} more
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              Shareable Link
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={shareUrl}
                  readOnly
                  className="h-9 border-border bg-muted/40 pl-8 font-mono text-xs text-foreground select-all"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="flex h-9 cursor-pointer items-center gap-1.5 bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90"
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
            className="h-8 cursor-pointer border-border text-xs font-bold text-foreground hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
