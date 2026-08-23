"use client"

import React, { useState, useMemo } from "react"
import { Plus, Sparkles, Loader2, CornerDownLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { renderItemIcon } from "@/components/icon-picker-modal"
import { parseMultiItemInput } from "@/lib/presets"

interface QuickAddModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routineName: string
  onAddBatch: (items: Array<{ name: string; emoji?: string }>) => Promise<void>
}

export function QuickAddModal({
  open,
  onOpenChange,
  routineName,
  onAddBatch,
}: QuickAddModalProps) {
  if (!open) return null

  return (
    <QuickAddModalInner
      open={open}
      onOpenChange={onOpenChange}
      routineName={routineName}
      onAddBatch={onAddBatch}
    />
  )
}

function QuickAddModalInner({
  open,
  onOpenChange,
  routineName,
  onAddBatch,
}: QuickAddModalProps) {
  const [inputText, setInputText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parsedItems = useMemo(() => {
    return parseMultiItemInput(inputText)
  }, [inputText])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (parsedItems.length === 0 || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAddBatch(parsedItems)
      setInputText("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Quick Add to {routineName}
              </DialogTitle>
              <p className="text-xs font-bold text-muted-foreground">
                Type multiple items separated by commas or paste a list.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. USB Cable, Notebook, ID Card, Water Bottle"
              rows={3}
              className="w-full rounded-xl border border-input bg-background p-3 text-sm font-bold text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  void handleSubmit()
                }
              }}
            />
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Icons are automatically detected
              </span>
              <span>Press Ctrl+Enter to submit</span>
            </div>
          </div>

          {/* Real-time Parsed Items Preview */}
          {parsedItems.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground">
                  Preview ({parsedItems.length} items to add):
                </span>
                <Badge variant="secondary" className="text-[10px] font-black">
                  Ready to add
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
                {parsedItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-black text-foreground shadow-2xs"
                  >
                    {renderItemIcon(item.emoji)}
                    <span>{item.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-xs font-black uppercase sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={parsedItems.length === 0 || isSubmitting}
              className="flex-1 cursor-pointer rounded-xl font-black tracking-wider uppercase sm:flex-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  Add {parsedItems.length > 0 ? `${parsedItems.length} Items` : "Items"}
                  <CornerDownLeft className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
