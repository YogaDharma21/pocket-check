"use client"

import React, { useState } from "react"
import { Sparkles, Check, ChevronDown, ChevronUp, CheckCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { renderItemIcon } from "@/components/icon-picker-modal"
import { SMART_PRESETS } from "@/lib/presets"
import { Id } from "@/convex/_generated/dataModel"

interface ChecklistItemData {
  _id: Id<"items">
  name: string
  isPacked: boolean
  emoji?: string
}

interface SmartIntelligenceBannerProps {
  routineName: string
  items: ChecklistItemData[]
  onQuickPack: (id: Id<"items">) => Promise<void>
}

export function SmartIntelligenceBanner({
  routineName,
  items,
  onQuickPack,
}: SmartIntelligenceBannerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPackingId, setIsPackingId] = useState<string | null>(null)

  if (items.length === 0) return null

  // Find if current routine matches a known preset
  const matchingPreset = SMART_PRESETS.find(
    (p) => p.name.toLowerCase() === routineName.toLowerCase()
  )

  // Determine "You usually bring" items list
  const usualBringNames: string[] = matchingPreset
    ? matchingPreset.items.map((i) => i.name)
    : items.slice(0, 5).map((i) => i.name)

  const missingItems = items.filter((i) => !i.isPacked)
  const missingCount = missingItems.length
  const isAllPacked = missingCount === 0

  const handlePack = async (id: Id<"items">) => {
    setIsPackingId(id)
    try {
      await onQuickPack(id)
    } finally {
      setIsPackingId(null)
    }
  }

  return (
    <Card className="overflow-hidden border-border bg-card shadow-xs transition-all">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-wider text-muted-foreground uppercase">
                  Packing Intelligence
                </span>
                <Badge
                  variant="outline"
                  className="h-5 px-2 py-0 text-[10px] font-bold text-muted-foreground"
                >
                  {isAllPacked ? "All Packed" : `${missingCount} Remaining`}
                </Badge>
              </div>
              <h3 className="text-sm font-extrabold text-foreground sm:text-base">
                Before you leave for {routineName}
              </h3>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
            title={isCollapsed ? "Expand intelligence" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="mt-3.5 space-y-3 pt-3 border-t border-border/60">
            {/* Usual gear reference list */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground">
                You usually bring:
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {usualBringNames.map((name, idx) => {
                  const matchingItem = items.find(
                    (i) => i.name.toLowerCase() === name.toLowerCase()
                  )
                  const isItemPacked = matchingItem?.isPacked ?? false

                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-all ${
                        isItemPacked
                          ? "border-border bg-muted/40 text-muted-foreground line-through opacity-70"
                          : "border-border bg-card text-foreground font-bold shadow-2xs"
                      }`}
                    >
                      {matchingItem && renderItemIcon(matchingItem.emoji)}
                      <span>{name}</span>
                      {isItemPacked && (
                        <Check className="h-3 w-3 text-primary ml-0.5 stroke-[2.5]" />
                      )}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Unpacked / Forgotten Items section (subtle, clean styling) */}
            {isAllPacked ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs font-bold text-foreground">
                <CheckCheck className="h-4 w-4 text-primary shrink-0" />
                <span>
                  Everything is packed and ready to go!
                </span>
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">
                    {missingCount === 1
                      ? `You haven't packed ${missingItems[0].name}:`
                      : `You haven't packed ${missingCount} items:`}
                  </p>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Tap to pack
                  </span>
                </div>

                {/* Missing items quick-pack interactive buttons */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {missingItems.map((item) => (
                    <Button
                      key={item._id}
                      size="sm"
                      variant="outline"
                      onClick={() => void handlePack(item._id)}
                      disabled={isPackingId === item._id}
                      className="group h-8 cursor-pointer gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-bold text-foreground transition-all hover:border-primary/50 hover:bg-muted"
                      title={`Mark ${item.name} as packed`}
                    >
                      {renderItemIcon(item.emoji)}
                      <span>{item.name}</span>
                      <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        + Pack
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
