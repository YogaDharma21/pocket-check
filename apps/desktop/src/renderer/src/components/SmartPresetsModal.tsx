import { useState } from "react";
import { Sparkles, ArrowRight, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  renderRoutineIcon,
  renderItemIcon,
} from "@/components/IconPickerModal";
import { SMART_PRESETS, PresetRoutine } from "@/lib/presets";

interface SmartPresetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoutine?: string;
  onSelectPreset: (preset: PresetRoutine, targetRoutine?: string) => Promise<void>;
}

export function SmartPresetsModal({
  open,
  onOpenChange,
  currentRoutine,
  onSelectPreset,
}: SmartPresetsModalProps) {
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);

  const handleApply = async (preset: PresetRoutine, targetRoutine?: string) => {
    setApplyingPresetId(`${preset.id}-${targetRoutine || "new"}`);
    try {
      await onSelectPreset(preset, targetRoutine);
      onOpenChange(false);
    } finally {
      setApplyingPresetId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Smart Packing Presets
              </DialogTitle>
              <p className="text-xs font-bold text-muted-foreground">
                Quickly start or populate your checklist with curated everyday essentials.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="grid grid-cols-1 gap-3">
            {SMART_PRESETS.map((preset) => {
              const isApplyingDirect = applyingPresetId === `${preset.id}-new`;
              const isApplyingToCurrent = applyingPresetId === `${preset.id}-${currentRoutine}`;
              const isBusy = !!applyingPresetId;

              return (
                <Card
                  key={preset.id}
                  className="group relative overflow-hidden border-border transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          {renderRoutineIcon(preset.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-foreground">
                              {preset.name}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-bold"
                            >
                              {preset.items.length} items
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">
                            {preset.description}
                          </p>
                        </div>
                      </div>

                      {/* Items Preview Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {preset.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground"
                          >
                            {renderItemIcon(item.emoji)}
                            <span>{item.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0 pt-2 sm:pt-0 sm:items-end">
                      <Button
                        onClick={() => void handleApply(preset)}
                        disabled={isBusy}
                        className="w-full cursor-pointer rounded-lg font-bold text-xs uppercase sm:w-auto"
                      >
                        {isApplyingDirect ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Open {preset.name} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>

                      {currentRoutine && currentRoutine.toLowerCase() !== preset.name.toLowerCase() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleApply(preset, currentRoutine)}
                          disabled={isBusy}
                          className="h-7 cursor-pointer text-[11px] font-bold text-muted-foreground hover:text-foreground"
                        >
                          {isApplyingToCurrent ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1 h-3 w-3" />
                              Add to {currentRoutine}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
