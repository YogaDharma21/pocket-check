import { useEffect, useState, useRef, useCallback } from "react";
import {
  Check,
  PackageCheck,
  ShieldCheck,
  Plus,
  RotateCcw,
  Trash2,
  Tag,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles,
  Clock,
  Undo2,
  Compass,
  MapPin,
  Share2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  renderRoutineIcon,
  renderItemIcon,
  IconPickerModal,
} from "@/components/IconPickerModal";
import { SmartPresetsModal } from "@/components/SmartPresetsModal";
import { SmartIntelligenceBanner } from "@/components/SmartIntelligenceBanner";
import { WeatherAlertBanner } from "@/components/WeatherAlertBanner";
import { ExportModal } from "@/components/ExportModal";
import { ShareRoutineModal } from "@/components/ShareRoutineModal";
import { RoutineScheduleModal } from "@/components/RoutineScheduleModal";
import { ImportSharedModal } from "@/components/ImportSharedModal";
import {
  parseMultiItemInput,
  detectIconForItem,
  PresetRoutine,
} from "@/lib/presets";
import {
  playCheckSound,
  playUncheckSound,
  playCompleteSound,
  playDeleteSound,
  playResetSound,
} from "@/lib/sound";
import { isOnlineBackendConfigured, useOfflineData } from "@/components/ConvexClientProvider";
import { OnlineDashboard } from "@/components/OnlineDashboard";

interface RestorableItem {
  routine: string;
  name: string;
  isPacked: boolean;
  emoji?: string;
  quantity?: number;
  locationNote?: string;
  order?: number;
}

export function Dashboard({
  onStatusChange,
}: {
  onStatusChange?: (routine: string, packedRatio: string) => void;
}) {
  if (isOnlineBackendConfigured) {
    return <OnlineDashboard onStatusChange={onStatusChange} />;
  }
  return <OfflineDashboard onStatusChange={onStatusChange} />;
}

// -----------------------------------------------------------------------------
// Offline / Standalone Dashboard Implementation
// -----------------------------------------------------------------------------
function OfflineDashboard({
  onStatusChange,
}: {
  onStatusChange?: (routine: string, packedRatio: string) => void;
}) {
  const { db, userId, routines, items, activeRoutine, setActiveRoutine } = useOfflineData();

  const [filter, setFilter] = useState<"all" | "packed" | "missing">("all");
  const [showNewRoutineModal, setShowNewRoutineModal] = useState(false);
  const [customRoutineName, setCustomRoutineName] = useState("");
  const [customRoutineIcon, setCustomRoutineIcon] = useState("tag");
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [newItemTag, setNewItemTag] = useState("");

  const [manageRoutine, setManageRoutine] = useState<any | null>(null);
  const [manageItem, setManageItem] = useState<any | null>(null);
  const [editModalName, setEditModalName] = useState("");
  const [editModalIconTag, setEditModalIconTag] = useState("");
  const [editModalQuantity, setEditModalQuantity] = useState<number | undefined>(undefined);
  const [editModalLocationNote, setEditModalLocationNote] = useState("");

  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<
    "newItem" | "editItem" | "newRoutine" | "editRoutine"
  >("newItem");

  const [showImportModal, setShowImportModal] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return !!params.get("import");
    }
    return false;
  });

  const [sharedImportData] = useState<any | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const importParam = params.get("import");
      if (importParam) {
        try {
          const decoded = JSON.parse(
            decodeURIComponent(escape(atob(decodeURIComponent(importParam))))
          );
          if (decoded && decoded.name && Array.isArray(decoded.items)) {
            return decoded;
          }
        } catch {}
      }
    }
    return null;
  });

  const [undoToast, setUndoToast] = useState<{
    message: string;
    items: RestorableItem[];
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(-1);
  const itemInputRef = useRef<HTMLInputElement>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const effectiveRoutine = activeRoutine || (routines.length > 0 ? routines[0].name : "");
  const currentRoutineObj = routines.find((r) => r.name === effectiveRoutine) || (routines.length > 0 ? routines[0] : null);

  // Auto-Reset Check
  useEffect(() => {
    if (!currentRoutineObj || !currentRoutineObj.autoResetTime) return;

    const checkSchedule = async () => {
      const now = new Date();
      const currentDay = now.getDay();
      const activeDays = currentRoutineObj.autoResetDays ?? [1, 2, 3, 4, 5];

      if (!activeDays.includes(currentDay)) return;

      const [hours, minutes] = currentRoutineObj.autoResetTime!.split(":").map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      const todayStr = now.toISOString().split("T")[0];
      if (now >= scheduledTime && currentRoutineObj.lastResetDate !== todayStr) {
        const res = await db.checkAndExecuteAutoReset(userId, {
          routineId: currentRoutineObj._id,
          currentDateStr: todayStr,
        });
        if (res.reset) {
          playResetSound();
        }
      }
    };

    checkSchedule();
    const timer = setInterval(checkSchedule, 30000);
    return () => clearInterval(timer);
  }, [currentRoutineObj, db, userId]);

  // Handle tray actions from Electron main process
  useEffect(() => {
    if (window.electronAPI?.onTrayAction) {
      const unsub = window.electronAPI.onTrayAction((action) => {
        if (action === "new-routine") {
          setShowNewRoutineModal(true);
        } else if (action === "reset-today") {
          handleReset();
        }
      });
      return unsub;
    }
  }, [effectiveRoutine]);

  const filteredItems = items.filter((item) => {
    if (filter === "packed") return item.isPacked;
    if (filter === "missing") return !item.isPacked;
    return true;
  });

  const totalItems = items.length;
  const packedItems = items.filter((i) => i.isPacked).length;
  const missingItems = totalItems - packedItems;
  const percentage = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  // Broadcast status to TitleBar
  useEffect(() => {
    if (onStatusChange && effectiveRoutine) {
      onStatusChange(effectiveRoutine, `${packedItems}/${totalItems}`);
    }
  }, [effectiveRoutine, packedItems, totalItems, onStatusChange]);

  const handleToggle = useCallback(
    async (itemId: string, currentPacked: boolean) => {
      const nextPacked = !currentPacked;
      if (nextPacked) {
        if (packedItems + 1 === totalItems && totalItems > 0) {
          playCompleteSound();
        } else {
          playCheckSound();
        }
      } else {
        playUncheckSound();
      }
      await db.toggleItem(userId, itemId, nextPacked);
    },
    [db, userId, packedItems, totalItems]
  );

  const handleReset = useCallback(async () => {
    if (!effectiveRoutine) return;
    playResetSound();
    await db.resetItems(userId, effectiveRoutine);
  }, [db, userId, effectiveRoutine]);

  const triggerUndo = (message: string, itemsToRestore: RestorableItem[]) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast({ message, items: itemsToRestore });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  const handleExecuteUndo = async () => {
    if (!undoToast || undoToast.items.length === 0) return;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    await db.restoreItems(userId, undoToast.items);
    setUndoToast(null);
  };

  const handleDeleteItemWithUndo = async (item: any) => {
    const restorable: RestorableItem = {
      routine: effectiveRoutine,
      name: item.name,
      isPacked: item.isPacked,
      emoji: item.emoji,
      quantity: item.quantity,
      locationNote: item.locationNote,
      order: item.order,
    };
    playDeleteSound();
    await db.deleteItem(userId, item._id);
    setManageItem(null);
    triggerUndo(`Deleted "${item.name}"`, [restorable]);
  };

  const handleDeleteAllCreatedItems = async () => {
    if (!effectiveRoutine) return;
    const backupItems: RestorableItem[] = items.map((i) => ({
      routine: effectiveRoutine,
      name: i.name,
      isPacked: i.isPacked,
      emoji: i.emoji,
      quantity: i.quantity,
      locationNote: i.locationNote,
      order: i.order,
    }));
    playDeleteSound();
    await db.deleteAllItems(userId, effectiveRoutine);
    setShowDeleteAllConfirm(false);
    if (backupItems.length > 0) {
      triggerUndo(`Cleared ${backupItems.length} items from ${effectiveRoutine}`, backupItems);
    }
  };

  const handleDropItem = async (targetId: string) => {
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }
    const sourceIndex = items.findIndex((i) => i._id === draggedItemId);
    const targetIndex = items.findIndex((i) => i._id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }
    const ids = items.map((i) => i._id);
    const [moved] = ids.splice(sourceIndex, 1);
    ids.splice(targetIndex, 0, moved);
    await db.reorderItems(userId, ids);
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleSelectPreset = async (preset: PresetRoutine, targetRoutine?: string) => {
    const routineNameToUse = targetRoutine || preset.name;
    setActiveRoutine(routineNameToUse);
    const res = await db.applyPreset(userId, {
      name: preset.name,
      icon: preset.icon,
      items: preset.items,
      targetRoutine,
    });
    if (res.routineName) {
      setActiveRoutine(res.routineName);
    }
  };

  const handleCreateRoutine = async () => {
    if (!customRoutineName.trim()) return;
    const routineName = customRoutineName.trim();
    const routineIcon = customRoutineIcon || "tag";
    await db.addRoutine(userId, { name: routineName, icon: routineIcon });
    setActiveRoutine(routineName);
    setCustomRoutineName("");
    setCustomRoutineIcon("tag");
    setShowNewRoutineModal(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveRoutine) return;
    const trimmed = newCustomItemName.trim();
    if (!trimmed) return;

    const selectedTag = newItemTag.trim();
    const parsed = parseMultiItemInput(trimmed, selectedTag);
    if (parsed.length === 0) return;

    setNewCustomItemName("");
    setNewItemTag("");

    if (parsed.length > 1) {
      const itemsToInsert = parsed.map((item) => ({
        name: item.name,
        emoji: selectedTag || item.emoji || detectIconForItem(item.name) || "Tag",
      }));
      await db.addItemsBatch(userId, effectiveRoutine, itemsToInsert);
      return;
    }

    const single = parsed[0];
    const detectedEmoji = selectedTag || single.emoji || detectIconForItem(single.name) || "Tag";
    await db.addItem(userId, {
      routine: effectiveRoutine,
      name: single.name,
      emoji: detectedEmoji,
    });
  };

  const handleMoveRoutineById = async (
    id: string,
    direction: -1 | 1
  ) => {
    const index = routines.findIndex((r) => r._id === id);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= routines.length) return;
    try {
      const ids = routines.map((r) => r._id);
      const [moved] = ids.splice(index, 1);
      ids.splice(targetIndex, 0, moved);
      await db.reorderRoutines(userId, ids);
    } catch (err) {
      console.error("Failed to reorder routine", err);
    }
  };

  let headline = "Let's double-check before you pack!";
  if (!effectiveRoutine) {
    headline = "No destinations created yet.";
  } else if (totalItems === 0) {
    headline = "Your pocket list is empty. Add items below!";
  } else if (packedItems === totalItems) {
    headline = "Excellent! You are 100% prepared to leave!";
  } else if (percentage >= 50) {
    headline = "Looking good! Keep grabbing those items!";
  }

  const liveDetectedIcon =
    newItemTag || (newCustomItemName.trim() ? detectIconForItem(newCustomItemName.trim()) : null);

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-12 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column / Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:col-span-4">
            {/* Progress Status Block */}
            <Card className="overflow-hidden border-border shadow-xs">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3.5 select-none">
                  <div
                    className={`shrink-0 rounded-lg p-2.5 ${
                      percentage === 100
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-primary"
                    }`}
                  >
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                        Pocket Status
                      </span>
                      <Badge
                        variant={percentage === 100 ? "default" : "secondary"}
                        className="px-2 py-0.5 text-[10px] font-black"
                      >
                        {Math.round(percentage)}% Packed
                      </Badge>
                    </div>
                    <h2 className="text-base leading-snug font-extrabold tracking-tight text-foreground sm:text-lg">
                      {headline}
                    </h2>
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress value={percentage} className="h-2.5" />
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span>
                      <strong className="font-black text-foreground">{packedItems}</strong> of {totalItems} items packed
                    </span>
                    <span>{missingItems} missing</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!effectiveRoutine || totalItems === 0}
                    onClick={() => void handleReset()}
                    className="h-8 cursor-pointer gap-1.5 rounded-lg px-2.5 text-[11px] font-black tracking-wider text-primary uppercase hover:text-primary/80 disabled:opacity-40"
                    title="Reset items in this routine to Missing (Shift+U)"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Uncheck All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!effectiveRoutine || totalItems === 0}
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="h-8 cursor-pointer gap-1.5 rounded-lg px-2.5 text-[11px] font-black tracking-wider text-destructive uppercase hover:text-destructive/80 disabled:opacity-40"
                    title="Delete all items in this routine"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear List
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Destinations / Routine Switcher */}
            <Card className="border-border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                    Destinations
                  </h3>
                  <p className="text-sm font-black text-foreground">Where are you heading?</p>
                </div>
                <Badge variant="outline" className="text-xs font-black">
                  {routines.length} lists
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                {routines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-4 text-center">
                    <Compass className="h-6 w-6 text-muted-foreground mb-1.5 opacity-60" />
                    <p className="text-xs font-bold text-foreground">No destinations yet</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Add a destination or choose a preset below.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      {routines.map((routine) => {
                        const isActive = routine.name === effectiveRoutine;
                        return (
                          <div
                            key={routine._id}
                            onClick={() => setActiveRoutine(routine.name)}
                            className={`group flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-all ${
                              isActive
                                ? "border-primary bg-primary font-black text-primary-foreground shadow-xs"
                                : "border-border bg-card font-bold text-foreground hover:bg-muted/60"
                            }`}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div
                                className={`shrink-0 rounded-lg p-2 ${
                                  isActive
                                    ? "bg-primary-foreground/15 text-primary-foreground"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                {renderRoutineIcon(routine.icon || routine.name)}
                              </div>
                              <div className="truncate min-w-0">
                                <span className="truncate text-sm select-none block">
                                  {routine.name}
                                </span>
                                {routine.autoResetTime && (
                                  <span className="text-[10px] font-mono opacity-70 flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {routine.autoResetTime}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManageRoutine(routine);
                                  setShowScheduleModal(true);
                                }}
                                className={`h-7 w-7 shrink-0 cursor-pointer rounded-lg opacity-70 transition-opacity group-hover:opacity-100 ${
                                  isActive
                                    ? "text-primary-foreground hover:bg-primary-foreground/20"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                                title="Schedule Auto-Reset"
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManageRoutine(routine);
                                  setEditModalName(routine.name);
                                  setEditModalIconTag(routine.icon);
                                }}
                                className={`h-7 w-7 shrink-0 cursor-pointer rounded-lg opacity-70 transition-opacity group-hover:opacity-100 ${
                                  isActive
                                    ? "text-primary-foreground hover:bg-primary-foreground/20"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                                title="Destination Settings"
                              >
                                <Settings className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="mt-2 flex flex-col gap-1.5">
                  <Button
                    variant="outline"
                    onClick={() => setShowPresetsModal(true)}
                    className="h-10 w-full cursor-pointer justify-center gap-2 rounded-lg text-xs font-black tracking-wider text-primary uppercase hover:bg-primary/10"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Smart Presets</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setCustomRoutineName("");
                      setCustomRoutineIcon("tag");
                      setShowNewRoutineModal(true);
                    }}
                    className="h-10 w-full cursor-pointer justify-center gap-2 rounded-lg text-xs font-black tracking-wider uppercase hover:bg-accent hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Destination</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column / Workspace */}
          <div className="space-y-5 lg:col-span-8">
            {!effectiveRoutine ? (
              <Card className="border-border shadow-xs">
                <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="rounded-lg bg-primary/10 p-4 text-primary mb-4">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-black text-foreground sm:text-2xl mb-1">
                    Ready to Start Packing?
                  </h2>
                  <p className="text-sm font-medium text-muted-foreground max-w-md mb-6">
                    Create your first destination or choose from smart presets like Work, Gym, Campus, or Travel.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      onClick={() => setShowPresetsModal(true)}
                      className="font-black text-xs uppercase tracking-wider h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Browse Smart Presets
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Active Destination Workspace Card Header */}
                <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-lg bg-primary/10 p-3 text-primary">
                      {renderRoutineIcon(currentRoutineObj?.icon || effectiveRoutine)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-foreground sm:text-2xl">
                          {effectiveRoutine}
                        </h2>
                        <Badge variant="secondary" className="text-xs font-black">
                          {items.length} items
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">
                        {packedItems} packed &bull; {missingItems} remaining
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Share & Export Quick Actions */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowShareModal(true)}
                        className="h-8 text-xs font-bold gap-1 cursor-pointer border-border"
                        title="Share Destination Routine"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExportModal(true)}
                        className="h-8 text-xs font-bold gap-1 cursor-pointer border-border"
                        title="Export Destination Checklist (Markdown, JSON, Print)"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    </div>

                    {/* Filter Segmented Control */}
                    <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/60 p-1 select-none w-full sm:w-64">
                      <button
                        type="button"
                        onClick={() => setFilter("all")}
                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black transition-all ${
                          filter === "all"
                            ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <span>All</span>
                        <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-extrabold">
                          {items.length}
                        </Badge>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilter("missing")}
                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black transition-all ${
                          filter === "missing"
                            ? "bg-card text-destructive shadow-xs ring-1 ring-destructive/30"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <span>Missing</span>
                        <Badge variant="destructive" className="rounded-md px-1.5 py-0 text-[10px] font-extrabold">
                          {missingItems}
                        </Badge>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFilter("packed")}
                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black transition-all ${
                          filter === "packed"
                            ? "bg-card text-primary shadow-xs ring-1 ring-primary/30"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <span>Packed</span>
                        <Badge variant="default" className="rounded-md px-1.5 py-0 text-[10px] font-extrabold">
                          {packedItems}
                        </Badge>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Weather Alert Banner */}
                <WeatherAlertBanner
                  currentRoutineItems={items}
                  onQuickAddItem={async (name, emoji) => {
                    await db.addItem(userId, {
                      routine: effectiveRoutine,
                      name,
                      emoji: emoji || "Umbrella",
                    });
                  }}
                />

                {/* Departure Intelligence Banner */}
                <SmartIntelligenceBanner
                  routineName={effectiveRoutine}
                  items={items}
                  onQuickPack={async (id) => {
                    await handleToggle(id, false);
                  }}
                />

                {/* Quick Add Bar */}
                <Card className="border-border shadow-xs">
                  <CardContent className="space-y-2 p-3.5 sm:p-4">
                    <form onSubmit={(e) => void handleAddItem(e)} className="flex flex-col items-center gap-2.5 sm:flex-row">
                      <div className="flex w-full gap-2 sm:flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIconPickerTarget("newItem");
                            setShowIconPicker(true);
                          }}
                          className="flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg px-0"
                          title="Select Icon for item"
                        >
                          {liveDetectedIcon ? (
                            renderItemIcon(liveDetectedIcon)
                          ) : (
                            <Tag className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Input
                          ref={itemInputRef}
                          type="text"
                          value={newCustomItemName}
                          onChange={(e) => setNewCustomItemName(e.target.value)}
                          placeholder="Add item..."
                          className="h-11 flex-1 text-sm font-bold"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={!newCustomItemName.trim()}
                        className="h-11 w-full cursor-pointer rounded-lg px-5 font-black tracking-wider uppercase sm:w-auto"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        {(() => {
                          const parsed = parseMultiItemInput(newCustomItemName, newItemTag);
                          return parsed.length > 1 ? `Add ${parsed.length} Items` : "Add Item";
                        })()}
                      </Button>
                    </form>

                    {(() => {
                      const parsed = parseMultiItemInput(newCustomItemName, newItemTag);
                      if (parsed.length > 1) {
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-bold text-muted-foreground">
                              Adding {parsed.length} items:
                            </span>
                            {parsed.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-bold text-foreground"
                              >
                                {renderItemIcon(item.emoji || newItemTag || "Tag")}
                                <span>{item.name}</span>
                              </span>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground px-1">
                          <span>Tip: Type comma/newline to bulk-add &bull; Space to toggle &bull; J/K to move</span>
                          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline">
                            Ctrl+K to focus
                          </kbd>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Items List */}
                <div className="space-y-3" id="checklist-container">
                  {filteredItems.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center text-sm font-bold text-muted-foreground">
                        <PackageCheck className="h-10 w-10 text-muted-foreground opacity-40" />
                        <div className="space-y-1">
                          <p className="text-base font-extrabold text-foreground">
                            {filter === "all"
                              ? "No items added to this destination yet"
                              : filter === "packed"
                              ? "No items are packed yet"
                              : "All items are packed!"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredItems.map((item, itemIdx) => {
                      const isDragging = draggedItemId === item._id;
                      const isDragOver = dragOverItemId === item._id;
                      const isFocused = focusedItemIndex === itemIdx;

                      return (
                        <Card
                          key={item._id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedItemId(item._id);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", item._id);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedItemId && draggedItemId !== item._id) {
                              setDragOverItemId(item._id);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverItemId === item._id) setDragOverItemId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            void handleDropItem(item._id);
                          }}
                          onDragEnd={() => {
                            setDraggedItemId(null);
                            setDragOverItemId(null);
                          }}
                          onClick={() => {
                            setFocusedItemIndex(itemIdx);
                            void handleToggle(item._id, item.isPacked);
                          }}
                          className={`relative cursor-pointer transition-all ${
                            item.isPacked ? "bg-muted/40" : "hover:bg-accent/40"
                          } ${isFocused ? "ring-2 ring-primary ring-offset-1" : ""} ${
                            isDragging ? "scale-[0.98] border-dashed border-primary opacity-40" : ""
                          } ${isDragOver ? "scale-[1.01] ring-2 ring-primary ring-offset-2" : ""}`}
                        >
                          <CardContent className="flex flex-row items-center justify-between gap-3 p-3.5">
                            <div className="flex min-w-0 flex-1 items-center gap-3 select-none">
                              <div
                                className="shrink-0 cursor-grab rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground active:cursor-grabbing"
                                title="Drag to reorder"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>

                              <div
                                className={`checkbox-ui flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all select-none ${
                                  item.isPacked
                                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                    : "border-border bg-card hover:border-primary/60"
                                }`}
                              >
                                {item.isPacked && <Check className="h-4 w-4 stroke-[3]" />}
                              </div>

                              <div className="shrink-0 rounded-lg bg-muted/60 p-2 text-foreground">
                                {renderItemIcon(item.emoji || item.name)}
                              </div>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4
                                    className={`truncate text-sm font-extrabold sm:text-base ${
                                      item.isPacked ? "text-muted-foreground line-through opacity-80" : "text-foreground"
                                    }`}
                                  >
                                    {item.name}
                                  </h4>
                                  {item.quantity && item.quantity > 1 && (
                                    <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold">
                                      {item.quantity}x
                                    </Badge>
                                  )}
                                </div>
                                {item.locationNote && (
                                  <p className="text-[11px] text-muted-foreground italic truncate">
                                    {item.locationNote}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManageItem(item);
                                  setEditModalName(item.name);
                                  setEditModalIconTag(item.emoji || "");
                                  setEditModalQuantity(item.quantity);
                                  setEditModalLocationNote(item.locationNote || "");
                                }}
                                className="h-8 w-8 cursor-pointer rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Edit Item"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating Undo Toast (UX-01) */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-2xl text-foreground animate-in slide-in-from-bottom-5">
          <p className="text-xs font-bold">{undoToast.message}</p>
          <Button
            size="sm"
            onClick={handleExecuteUndo}
            className="h-7 text-xs font-bold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <Undo2 className="h-3 w-3" /> Undo
          </Button>
          <button
            onClick={() => setUndoToast(null)}
            className="text-xs text-muted-foreground hover:text-foreground ml-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Modals */}
      <SmartPresetsModal
        open={showPresetsModal}
        onOpenChange={setShowPresetsModal}
        currentRoutine={effectiveRoutine}
        onSelectPreset={handleSelectPreset}
      />

      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        routineName={effectiveRoutine}
        items={items}
      />

      <ShareRoutineModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        routineName={effectiveRoutine}
        routineIcon={currentRoutineObj?.icon || "tag"}
        items={items}
      />

      <ImportSharedModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        data={sharedImportData}
        onConfirmImport={async () => {
          if (sharedImportData) {
            await handleSelectPreset(sharedImportData as any);
          }
        }}
      />

      <RoutineScheduleModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        routineName={manageRoutine?.name || effectiveRoutine}
        initialTime={manageRoutine?.autoResetTime || "06:00"}
        initialDays={manageRoutine?.autoResetDays || [1, 2, 3, 4, 5]}
        onSaveSchedule={async (time, days) => {
          if (manageRoutine) {
            await db.updateRoutine(userId, {
              id: manageRoutine._id,
              name: manageRoutine.name,
              icon: manageRoutine.icon,
              autoResetTime: time,
              autoResetDays: days,
            });
          }
        }}
      />

      <IconPickerModal
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        selectedKey={
          iconPickerTarget === "newItem"
            ? newItemTag
            : iconPickerTarget === "editItem"
            ? editModalIconTag
            : iconPickerTarget === "newRoutine"
            ? customRoutineIcon
            : editModalIconTag
        }
        onSelectIcon={(iconKey) => {
          if (iconPickerTarget === "newItem") setNewItemTag(iconKey);
          else if (iconPickerTarget === "editItem") setEditModalIconTag(iconKey);
          else if (iconPickerTarget === "newRoutine") setCustomRoutineIcon(iconKey);
          else if (iconPickerTarget === "editRoutine") setEditModalIconTag(iconKey);
        }}
      />

      {/* New Destination Modal */}
      <Dialog open={showNewRoutineModal} onOpenChange={setShowNewRoutineModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">New Destination</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIconPickerTarget("newRoutine");
                  setShowIconPicker(true);
                }}
                className="h-10 w-12 shrink-0 p-0"
              >
                {renderRoutineIcon(customRoutineIcon)}
              </Button>
              <Input
                type="text"
                value={customRoutineName}
                onChange={(e) => setCustomRoutineName(e.target.value)}
                placeholder="Destination name (e.g. Gym, Library, Tokyo Trip)..."
                className="h-10 text-sm font-bold"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateRoutine}
              disabled={!customRoutineName.trim()}
              className="font-bold text-xs uppercase"
            >
              Create Destination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      {manageItem && (
        <Dialog open={!!manageItem} onOpenChange={(open) => !open && setManageItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Edit Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIconPickerTarget("editItem");
                    setShowIconPicker(true);
                  }}
                  className="h-10 w-12 shrink-0 p-0"
                >
                  {renderItemIcon(editModalIconTag || editModalName)}
                </Button>
                <Input
                  type="text"
                  value={editModalName}
                  onChange={(e) => setEditModalName(e.target.value)}
                  placeholder="Item name"
                  className="h-10 text-sm font-bold flex-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={editModalQuantity ?? ""}
                    onChange={(e) =>
                      setEditModalQuantity(e.target.value ? parseInt(e.target.value, 10) : undefined)
                    }
                    placeholder="1"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Location Note
                  </label>
                  <Input
                    type="text"
                    value={editModalLocationNote}
                    onChange={(e) => setEditModalLocationNote(e.target.value)}
                    placeholder="e.g. Front pocket"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteItemWithUndo(manageItem)}
                className="text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (!editModalName.trim()) return;
                  await db.editItem(userId, {
                    id: manageItem._id,
                    name: editModalName.trim(),
                    emoji: editModalIconTag || undefined,
                    quantity: editModalQuantity,
                    locationNote: editModalLocationNote || undefined,
                  });
                  setManageItem(null);
                }}
                className="text-xs font-bold"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Routine Modal */}
      <Dialog
        open={!!manageRoutine && !showScheduleModal}
        onOpenChange={(open) => !open && setManageRoutine(null)}
      >
        {manageRoutine && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Destination Settings</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                  Destination Icon & Name
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIconPickerTarget("editRoutine");
                      setShowIconPicker(true);
                    }}
                    className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg px-0 cursor-pointer"
                    title="Select Destination Icon"
                  >
                    {renderRoutineIcon(editModalIconTag || editModalName)}
                  </Button>
                  <Input
                    type="text"
                    value={editModalName}
                    onChange={(e) => setEditModalName(e.target.value)}
                    placeholder="Destination name..."
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Reordering */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                  Change Order
                </label>
                <div className="flex gap-2">
                  {(() => {
                    const rIndex = routines.findIndex(
                      (r) => r._id === manageRoutine._id
                    );
                    return (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveRoutineById(manageRoutine._id, -1);
                          }}
                          disabled={rIndex <= 0}
                          className="flex-1 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1.5" /> Move Left
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveRoutineById(manageRoutine._id, 1);
                          }}
                          disabled={
                            rIndex === -1 || rIndex >= routines.length - 1
                          }
                          className="flex-1 cursor-pointer"
                        >
                          Move Right <ChevronRight className="h-4 w-4 ml-1.5" />
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 border-t-0 p-0 pt-2 mt-2">
                <Button
                  onClick={async () => {
                    if (!editModalName.trim()) return;
                    try {
                      await db.updateRoutine(userId, {
                        id: manageRoutine._id,
                        name: editModalName.trim(),
                        icon: editModalIconTag || manageRoutine.icon,
                      });
                      const oldName = manageRoutine.name;
                      if (activeRoutine === oldName) {
                        setActiveRoutine(editModalName.trim());
                      }
                      setManageRoutine(null);
                    } catch (err) {
                      console.error("Failed to update routine", err);
                    }
                  }}
                  className="w-full font-black tracking-wider uppercase cursor-pointer"
                >
                  SAVE CHANGES
                </Button>

                <div className="flex w-full gap-2">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (
                        !confirm(
                          `Delete "${manageRoutine.name}" and all its items?`
                        )
                      )
                        return;
                      try {
                        const routineToDeleteName = manageRoutine.name;
                        const routineToDeleteId = manageRoutine._id;
                        await db.deleteRoutine(userId, routineToDeleteId);
                        const remaining = routines.filter(
                          (r) => r._id !== routineToDeleteId
                        );
                        if (
                          activeRoutine === routineToDeleteName ||
                          effectiveRoutine === routineToDeleteName
                        ) {
                          setActiveRoutine(
                            remaining.length > 0 ? remaining[0].name : ""
                          );
                        }
                        setManageRoutine(null);
                      } catch (err) {
                        console.error("Failed to delete routine", err);
                      }
                    }}
                    className="flex-1 text-xs font-bold tracking-wider uppercase cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> DELETE DESTINATION
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setManageRoutine(null)}
                    className="flex-1 text-xs font-bold tracking-wider uppercase cursor-pointer"
                  >
                    CANCEL
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive">
              Clear All Items in {effectiveRoutine}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            This will remove all {items.length} items from {effectiveRoutine}. You can undo this action within 5 seconds.
          </p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteAllConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteAllCreatedItems}>
              Clear Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
