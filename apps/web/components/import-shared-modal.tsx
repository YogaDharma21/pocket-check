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
import { Sparkles, Download } from "lucide-react"

interface ImportSharedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: {
    name: string
    icon: string
    items: Array<{
      name: string
      emoji?: string
      quantity?: number
      locationNote?: string
    }>
  } | null
  onConfirmImport: () => Promise<void>
}

export function ImportSharedModal({
  open,
  onOpenChange,
  data,
  onConfirmImport,
}: ImportSharedModalProps) {
  const [importing, setImporting] = React.useState(false)

  if (!data) return null

  const handleImport = async () => {
    setImporting(true)
    try {
      await onConfirmImport()
      onOpenChange(false)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-card-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-foreground" />
            <span>Shared Routine Received</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Import &ldquo;{data.name}&rdquo; Checklist
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Someone shared this packing routine with you. Import it into your account to use and customize it anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">{data.name}</span>
              <span className="text-muted-foreground">{data.items.length} items</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {data.items.map((item, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-md bg-card border border-border text-foreground flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                  {item.name}
                  {item.quantity && item.quantity > 1 ? (
                    <span className="text-muted-foreground text-[10px]">
                      ({item.quantity}x)
                    </span>
                  ) : null}
                  {item.locationNote ? (
                    <span className="text-muted-foreground text-[10px] italic">
                      &bull; {item.locationNote}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Dismiss
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={importing}
            className="text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center gap-1.5 px-4 cursor-pointer"
            onClick={handleImport}
          >
            {importing ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Import to My PocketCheck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
