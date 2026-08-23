"use client"

import React, { useState } from "react"
import { Sparkles, ArrowRight, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  renderRoutineIcon,
  renderItemIcon,
} from "@/components/icon-picker-modal"
import { SMART_PRESETS, PresetRoutine } from "@/lib/presets"

interface SmartPresetsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPreset: (preset: PresetRoutine) => Promise<void>
}

export function SmartPresetsModal({
  open,
  onOpenChange,
  onSelectPreset,
}: SmartPresetsModalProps) {
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null)

  const handleApply = async (preset: PresetRoutine) => {
    setApplyingPresetId(preset.id)
    try {
      await onSelectPreset(preset)
      onOpenChange(false)
    } finally {
      setApplyingPresetId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Smart Packing Presets
              </DialogTitle>
              <p className="text-xs font-bold text-muted-foreground">
                Instantly populate your checklist with curated everyday essentials.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-3.5">
            {SMART_PRESETS.map((preset) => {
              const isApplying = applyingPresetId === preset.id

              return (
                <Card
                  key={preset.id}
                  className="group relative overflow-hidden border-border transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="space-y-2.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          {renderRoutineIcon(preset.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-foreground">
                              {preset.name}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-black"
                            >
                              {preset.items.length} items
                            </Badge>
                          </div>
                          <p className="text-xs font-bold text-muted-foreground">
                            {preset.description}
                          </p>
                        </div>
                      </div>

                      {/* Items Preview Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {preset.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-bold text-foreground"
                          >
                            {renderItemIcon(item.emoji)}
                            <span>{item.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 pt-2 sm:pt-0">
                      <Button
                        onClick={() => void handleApply(preset)}
                        disabled={!!applyingPresetId}
                        className="w-full cursor-pointer rounded-xl font-black tracking-wider uppercase sm:w-auto"
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            Use Preset <ArrowRight className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
