import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Check,
  PackageCheck,
  ShieldCheck,
  Plus,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Tag,
  GripVertical,
  AlertTriangle,
  Settings,
  Sparkles,
  Share2,
  Download,
  Clock,
  Undo2,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

interface RestorableItem {
  routine: string;
  name: string;
  isPacked: boolean;
  emoji?: string;
  quantity?: number;
  locationNote?: string;
  order?: number;
}

export function OnlineDashboard({
  onStatusChange,
}: {
  onStatusChange?: (routine: string, packedRatio: string) => void;
}) {
  const [selectedRoutine, setSelectedRoutine] = useState<string>("");
  const [showNewRoutineModal, setShowNewRoutineModal] = useState(false);
  const [customRoutineName, setCustomRoutineName] = useState("");
  const [customRoutineIcon, setCustomRoutineIcon] = useState("tag");
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [newItemTag, setNewItemTag] = useState("");

  // Modal active configuration states
  const [manageRoutine, setManageRoutine] = useState<{
    _id: Id<"routines">;
    name: string;
    icon: string;
    autoResetTime?: string;
    autoResetDays?: number[];
    order?: number;
  } | null>(null);

  const [manageItem, setManageItem] = useState<{
    _id: Id<"items">;
    name: string;
    emoji?: string;
    quantity?: number;
    locationNote?: string;
    isPacked: boolean;
    order?: number;
  } | null>(null);

  const [editModalName, setEditModalName] = useState("");
  const [editModalIconTag, setEditModalIconTag] = useState("");
  const [editModalQuantity, setEditModalQuantity] = useState<number | undefined>(undefined);
  const [editModalLocationNote, setEditModalLocationNote] = useState("");

  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return !!params.get("import");
    }
    return false;
  });
  const [sharedImportData] = useState<{
    name: string;
    icon: string;
    items: Array<{
      name: string;
      emoji?: string;
      quantity?: number;
      locationNote?: string;
    }>;
  } | null>(() => {
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
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  // Floating Undo Toast State
  const [undoToast, setUndoToast] = useState<{
    message: string;
    items: RestorableItem[];
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard navigation highlight
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(-1);
  const itemInputRef = useRef<HTMLInputElement>(null);

  // Live Convex mutations & queries
  const ensureInitialized = useMutation(api.pocketcheck.ensureInitialized);
  const addRoutine = useMutation(api.pocketcheck.addRoutine);
  const updateRoutine = useMutation(api.pocketcheck.updateRoutine);
  const deleteRoutine = useMutation(api.pocketcheck.deleteRoutine);
  const addItem = useMutation(api.pocketcheck.addItem);
  const addItemsBatch = useMutation(api.pocketcheck.addItemsBatch);
  const applyPreset = useMutation(api.pocketcheck.applyPreset);
  const editItemMutation = useMutation(api.pocketcheck.editItem);
  const toggleItem = useMutation(api.pocketcheck.toggleItem);
  const deleteItem = useMutation(api.pocketcheck.deleteItem);
  const resetItems = useMutation(api.pocketcheck.resetItems);
  const deleteAllItems = useMutation(api.pocketcheck.deleteAllItems);
  const restoreItems = useMutation(api.pocketcheck.restoreItems);
  const checkAndExecuteAutoReset = useMutation(api.pocketcheck.checkAndExecuteAutoReset);
  const reorderItems = useMutation(api.pocketcheck.reorderItems);
  const reorderRoutines = useMutation(api.pocketcheck.reorderRoutines);

  const customRoutines = useQuery(api.pocketcheck.listRoutines);
  const isRoutinesLoading = customRoutines === undefined;
  const routinesList = useMemo(() => customRoutines ?? [], [customRoutines]);
  const currentRoutineObj =
    routinesList.find((r) => r.name === selectedRoutine) ||
    (routinesList.length > 0 ? routinesList[0] : null);
  const effectiveRoutine = currentRoutineObj ? currentRoutineObj.name : "";

  const rawItems = useQuery(
    api.pocketcheck.listItems,
    effectiveRoutine ? { routine: effectiveRoutine } : "skip"
  );
  const isItemsLoading = effectiveRoutine ? rawItems === undefined : false;
  const items = rawItems ?? [];

  // Filter & Drag State
  const [filter, setFilter] = useState<"all" | "packed" | "missing">("all");
  const [draggedItemId, setDraggedItemId] = useState<Id<"items"> | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<Id<"items"> | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<
    "newItem" | "editItem" | "newRoutine" | "editRoutine"
  >("newItem");

  // Ensure default state on first run
  useEffect(() => {
    void ensureInitialized();
  }, [ensureInitialized]);

  // Auto-Reset Time check per routine
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
        try {
          const res = await checkAndExecuteAutoReset({
            routineId: currentRoutineObj._id,
            currentDateStr: todayStr,
          });
          if (res?.reset) {
            playResetSound();
          }
        } catch (err) {
          console.warn("Auto-reset execution failed", err);
        }
      }
    };

    void checkSchedule();
    const timer = setInterval(checkSchedule, 30000);
    return () => clearInterval(timer);
  }, [currentRoutineObj, checkAndExecuteAutoReset]);

  // Filtered items list
  const filteredItems = items.filter((item) => {
    if (filter === "packed") return item.isPacked;
    if (filter === "missing") return !item.isPacked;
    return true;
  });

  // Calculate metrics
  const totalItems = items.length;
  const packedItems = items.filter((i) => i.isPacked).length;
  const missingItems = totalItems - packedItems;
  const percentage = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  // Broadcast TitleBar status
  useEffect(() => {
    if (onStatusChange && effectiveRoutine) {
      onStatusChange(effectiveRoutine, `${packedItems}/${totalItems}`);
    }
  }, [effectiveRoutine, packedItems, totalItems, onStatusChange]);

  // Handlers
  const handleToggle = useCallback(
    async (itemId: Id<"items">, currentPacked: boolean) => {
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
      try {
        await toggleItem({ id: itemId, isPacked: nextPacked });
      } catch (err) {
        console.error("Failed to toggle item", err);
      }
    },
    [toggleItem, packedItems, totalItems]
  );

  const handleReset = useCallback(async () => {
    if (!effectiveRoutine) return;
    playResetSound();
    try {
      await resetItems({ routine: effectiveRoutine });
    } catch (err) {
      console.error("Failed to reset list", err);
    }
  }, [resetItems, effectiveRoutine]);

  // Electron Tray Actions
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
  }, [handleReset]);

  // Keyboard navigation shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        itemInputRef.current?.focus();
        itemInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (focusedItemIndex >= 0 && focusedItemIndex < filteredItems.length) {
          const item = filteredItems[focusedItemIndex];
          void handleToggle(item._id, item.isPacked);
        } else if (filteredItems.length > 0) {
          const firstMissing =
            filteredItems.find((i) => !i.isPacked) || filteredItems[0];
          void handleToggle(firstMissing._id, firstMissing.isPacked);
        }
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedItemIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      }

      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedItemIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      }

      if (e.shiftKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        void handleReset();
      }

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= routinesList.length) {
        e.preventDefault();
        setSelectedRoutine(routinesList[num - 1].name);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, focusedItemIndex, routinesList, handleToggle, handleReset]);

  // Trigger floating Undo toast
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
    try {
      await restoreItems({ items: undoToast.items });
      setUndoToast(null);
    } catch (err) {
      console.error("Failed to restore items", err);
    }
  };

  const handleDeleteItemWithUndo = async (item: {
    _id: Id<"items">;
    name: string;
    emoji?: string;
    quantity?: number;
    locationNote?: string;
    isPacked: boolean;
    order?: number;
  }) => {
    try {
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
      await deleteItem({ id: item._id });
      setManageItem(null);
      triggerUndo(`Deleted "${item.name}"`, [restorable]);
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const handleDeleteAllCreatedItems = async () => {
    if (!effectiveRoutine) return;
    try {
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
      await deleteAllItems({ routine: effectiveRoutine });
      setShowDeleteAllConfirm(false);
      if (backupItems.length > 0) {
        triggerUndo(
          `Cleared ${backupItems.length} items from ${effectiveRoutine}`,
          backupItems
        );
      }
    } catch (err) {
      console.error("Failed to delete all items", err);
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

  const handleDropItem = async (targetId: Id<"items">) => {
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

    try {
      const ids = items.map((i) => i._id);
      const [moved] = ids.splice(sourceIndex, 1);
      ids.splice(targetIndex, 0, moved);
      await reorderItems({ ids });
    } catch (err) {
      console.error("Failed to reorder item via drag & drop", err);
    } finally {
      setDraggedItemId(null);
      setDragOverItemId(null);
    }
  };

  const handleMoveRoutineById = async (
    id: Id<"routines">,
    direction: -1 | 1
  ) => {
    const index = routinesList.findIndex((r) => r._id === id);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= routinesList.length) return;
    try {
      const ids = routinesList.map((r) => r._id);
      const [moved] = ids.splice(index, 1);
      ids.splice(targetIndex, 0, moved);
      await reorderRoutines({ ids });
    } catch (err) {
      console.error("Failed to reorder routine", err);
    }
  };

  const handleSelectPreset = async (
    preset: PresetRoutine,
    targetRoutine?: string
  ) => {
    const routineNameToUse = targetRoutine || preset.name;
    setSelectedRoutine(routineNameToUse);

    try {
      const res = await applyPreset({
        name: preset.name,
        icon: preset.icon,
        items: preset.items.map((i) => ({
          name: i.name,
          ...(i.emoji ? { emoji: i.emoji } : {}),
        })),
        targetRoutine: targetRoutine,
      });
      if (res?.routineName) {
        setSelectedRoutine(res.routineName);
      }
    } catch (err) {
      console.warn("applyPreset fallback", err);
      const existingRoutine = routinesList.find(
        (r) =>
          r.name.toLowerCase().trim() === routineNameToUse.toLowerCase().trim()
      );
      if (!existingRoutine) {
        await addRoutine({
          name: routineNameToUse,
          icon: preset.icon,
        });
      }
      setSelectedRoutine(routineNameToUse);

      const existingNames = new Set(
        items.map((i) => i.name.toLowerCase().trim())
      );
      for (const item of preset.items) {
        if (!existingNames.has(item.name.toLowerCase().trim())) {
          await addItem({
            routine: routineNameToUse,
            name: item.name,
            emoji: item.emoji,
          });
        }
      }
    }
  };

  const handleCreateRoutine = async () => {
    if (!customRoutineName.trim()) return;
    const routineName = customRoutineName.trim();
    const routineIcon = customRoutineIcon || "pin";
    try {
      await addRoutine({
        name: routineName,
        icon: routineIcon,
      });
      setSelectedRoutine(routineName);
      setCustomRoutineName("");
      setCustomRoutineIcon("tag");
      setShowNewRoutineModal(false);
    } catch (err) {
      console.error("Failed to create routine", err);
    }
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
        emoji:
          selectedTag ||
          item.emoji ||
          detectIconForItem(item.name) ||
          "Tag",
      }));

      try {
        await addItemsBatch({
          routine: effectiveRoutine,
          items: itemsToInsert,
        });
      } catch (err) {
        console.warn("addItemsBatch fallback", err);
        for (const item of itemsToInsert) {
          await addItem({
            routine: effectiveRoutine,
            name: item.name,
            emoji: item.emoji,
          });
        }
      }
      return;
    }

    const single = parsed[0];
    const detectedEmoji =
      selectedTag || single.emoji || detectIconForItem(single.name) || "Tag";

    try {
      await addItem({
        routine: effectiveRoutine,
        name: single.name,
        emoji: detectedEmoji,
      });
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  const liveDetectedIcon =
    newItemTag || (newCustomItemName.trim() ? detectIconForItem(newCustomItemName.trim()) : null);

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-12 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column / Destinations Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-14 lg:col-span-4">
            {/* 1. Progress Status Block */}
            <Card className="overflow-hidden border-border shadow-xs">
              <CardContent className="space-y-4 p-5">
                {isRoutinesLoading ? (
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-5 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-lg" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                  </div>
                ) : (
                  <>
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
                        <h2
                          id="status-headline"
                          className="text-base leading-snug font-extrabold tracking-tight text-card-foreground sm:text-lg"
                        >
                          {headline}
                        </h2>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Progress value={percentage} className="h-2.5" />
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                        <span id="progress-text">
                          <strong className="font-black text-foreground">
                            {packedItems}
                          </strong>{" "}
                          of {totalItems} items packed
                        </span>
                        <span>{missingItems} missing</span>
                      </div>
                    </div>

                    {/* Quick Action buttons in progress card */}
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!effectiveRoutine || totalItems === 0}
                        onClick={() => void handleReset()}
                        className="h-8 cursor-pointer gap-1.5 rounded-lg px-2.5 text-[11px] font-black tracking-wider text-primary uppercase hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Reset items in this routine to Missing position (Shift+U)"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Uncheck All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!effectiveRoutine || totalItems === 0}
                        onClick={() => setShowDeleteAllConfirm(true)}
                        className="h-8 cursor-pointer gap-1.5 rounded-lg px-2.5 text-[11px] font-black tracking-wider text-destructive uppercase hover:text-destructive/80 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Delete all created items in this routine"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Clear List
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 2. Destination / Routine Switcher */}
            <Card className="border-border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                    Destinations
                  </h3>
                  <p className="text-sm font-black text-foreground">
                    Where are you heading?
                  </p>
                </div>
                {isRoutinesLoading ? (
                  <Skeleton className="h-5 w-12 rounded-lg" />
                ) : (
                  <Badge variant="outline" className="text-xs font-black">
                    {routinesList.length} lists
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                {isRoutinesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-11 w-full rounded-lg" />
                    <Skeleton className="h-11 w-full rounded-lg" />
                    <Skeleton className="h-11 w-full rounded-lg" />
                  </div>
                ) : routinesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-4 text-center">
                    <Compass className="h-6 w-6 text-muted-foreground mb-1.5 opacity-60" />
                    <p className="text-xs font-bold text-foreground">No destinations yet</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Add a destination or choose a preset below.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop vertical list view */}
                    <div className="hidden flex-col gap-1.5 lg:flex">
                      {routinesList.map((routine) => {
                        const isActive = routine.name === effectiveRoutine;
                        return (
                          <div
                            key={routine.name}
                            onClick={() => {
                              setSelectedRoutine(routine.name);
                            }}
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
                              <span className="truncate text-sm tracking-tight capitalize">
                                {routine.name}
                              </span>
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

                    {/* Mobile horizontal scrolling chips */}
                    <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden no-scrollbar">
                      {routinesList.map((routine) => {
                        const isActive = routine.name === effectiveRoutine;
                        return (
                          <button
                            key={routine.name}
                            type="button"
                            onClick={() => setSelectedRoutine(routine.name)}
                            className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition-all ${
                              isActive
                                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                : "border-border bg-card text-foreground hover:bg-muted"
                            }`}
                          >
                            <span>{renderRoutineIcon(routine.icon || routine.name)}</span>
                            <span className="capitalize">{routine.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Create & Smart Presets Button */}
                <div className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPresetsModal(true)}
                    className="w-full justify-center gap-2 border-border py-2 text-xs font-black tracking-wider text-foreground uppercase hover:bg-muted"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Smart Presets</span>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => setShowNewRoutineModal(true)}
                    className="w-full justify-center gap-2 py-2 text-xs font-black tracking-wider uppercase"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Destination</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column / Items Checklist */}
          <div className="space-y-6 lg:col-span-8">
            {/* Header of Active Routine */}
            {effectiveRoutine && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-foreground text-xl">
                    {renderRoutineIcon(currentRoutineObj?.icon || effectiveRoutine)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-foreground capitalize">
                      {effectiveRoutine}
                    </h2>
                    <p className="text-xs font-bold text-muted-foreground">
                      {totalItems} items • {packedItems} packed • {missingItems} remaining
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentRoutineObj) {
                        setManageRoutine(currentRoutineObj);
                      }
                      setShowScheduleModal(true);
                    }}
                    className="h-8 gap-1.5 text-xs font-bold cursor-pointer"
                    title="Schedule Auto-Reset for this Destination"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Schedule</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShareModal(true)}
                    className="h-8 gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportModal(true)}
                    className="h-8 gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </Button>

                  {/* Filter tabs */}
                  <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5">
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition-colors ${
                        filter === "all"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All <span className="opacity-70">{totalItems}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("missing")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition-colors ${
                        filter === "missing"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Missing <span className="text-destructive">{missingItems}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("packed")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition-colors ${
                        filter === "packed"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Packed <span className="text-primary">{packedItems}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Weather Alerts */}
            {effectiveRoutine && (
              <WeatherAlertBanner
                currentRoutineItems={items}
                onQuickAddItem={async (itemName, iconTag) => {
                  await addItem({
                    routine: effectiveRoutine,
                    name: itemName,
                    emoji: iconTag || "Umbrella",
                  });
                }}
              />
            )}

            {/* Departure Intelligence */}
            {effectiveRoutine && (
              <SmartIntelligenceBanner
                routineName={effectiveRoutine}
                items={items}
                onQuickPack={async (id) => {
                  const target = items.find((i) => i._id === id);
                  if (target) {
                    await handleToggle(target._id, target.isPacked);
                  }
                }}
              />
            )}

            {/* Quick Add Item Bar with Live Auto-Icon Detection */}
            {effectiveRoutine && (
              <Card className="border-border shadow-xs">
                <CardContent className="space-y-2 p-3.5 sm:p-4">
                  <form
                    onSubmit={(e) => {
                      void handleAddItem(e);
                    }}
                    className="flex flex-col items-center gap-2.5 sm:flex-row"
                  >
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
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button
                        type="submit"
                        disabled={!newCustomItemName.trim()}
                        className="h-11 w-full cursor-pointer rounded-lg px-5 font-black tracking-wider uppercase sm:w-auto"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        {(() => {
                          const parsed = parseMultiItemInput(
                            newCustomItemName,
                            newItemTag
                          );
                          if (parsed.length > 1) {
                            return `Add ${parsed.length} Items`;
                          }
                          return "Add Item";
                        })()}
                      </Button>
                    </div>
                  </form>

                  {/* Live preview for multi-item comma entry */}
                  {(() => {
                    const parsed = parseMultiItemInput(
                      newCustomItemName,
                      newItemTag
                    );
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
                              {renderItemIcon(
                                item.emoji || newItemTag || "Tag"
                              )}
                              <span>{item.name}</span>
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-center justify-between px-1 text-[11px] font-bold text-muted-foreground">
                        <span>
                          Tip: Type comma-separated items to bulk-add &bull;
                          Space to toggle &bull; J/K to move
                        </span>
                        <kbd className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                          Ctrl+K to focus
                        </kbd>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Items Checklist List */}
            {isItemsLoading ? (
              <div className="space-y-2.5">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
                <PackageCheck className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <h3 className="text-base font-black text-foreground">
                  {filter === "all"
                    ? "No items in this checklist"
                    : filter === "packed"
                      ? "No packed items yet"
                      : "All items are packed!"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  {filter === "all"
                    ? "Use the bar above or pick a smart preset to populate your pocket check."
                    : "Toggle items using Space or by clicking the checkboxes."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item, index) => {
                  const isHighlighted = focusedItemIndex === index;
                  const isBeingDragged = draggedItemId === item._id;
                  const isBeingDraggedOver = dragOverItemId === item._id;

                  return (
                    <div
                      key={item._id}
                      draggable
                      onDragStart={() => setDraggedItemId(item._id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverItemId !== item._id) {
                          setDragOverItemId(item._id);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        void handleDropItem(item._id);
                      }}
                      onDragEnd={() => {
                        setDraggedItemId(null);
                        setDragOverItemId(null);
                      }}
                      onClick={() => void handleToggle(item._id, item.isPacked)}
                      className={`group relative flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3.5 transition-all select-none ${
                        item.isPacked
                          ? "border-border/60 bg-muted/40 text-muted-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/50 shadow-xs"
                      } ${isHighlighted ? "ring-2 ring-primary ring-offset-2" : ""} ${
                        isBeingDragged ? "opacity-40" : ""
                      } ${isBeingDraggedOver ? "border-primary border-t-2" : ""}`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <button
                          type="button"
                          className="cursor-grab text-muted-foreground opacity-30 group-hover:opacity-100 hover:text-foreground active:cursor-grabbing p-0.5"
                          onClick={(e) => e.stopPropagation()}
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                            item.isPacked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 bg-card hover:border-primary"
                          }`}
                        >
                          {item.isPacked && <Check className="h-4 w-4 stroke-[3]" />}
                        </div>

                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-base shrink-0">
                            {renderItemIcon(item.emoji || item.name)}
                          </span>
                          <span
                            className={`truncate text-sm font-bold tracking-tight ${
                              item.isPacked ? "line-through opacity-70" : ""
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.quantity && item.quantity > 1 && (
                            <Badge variant="secondary" className="text-[10px] font-black px-1.5 py-0 h-4">
                              {item.quantity}x
                            </Badge>
                          )}
                          {item.locationNote && (
                            <span className="text-[11px] font-semibold text-muted-foreground truncate hidden sm:inline">
                              📍 {item.locationNote}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
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
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit item details"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs font-bold text-foreground">{undoToast.message}</span>
          <Button
            size="sm"
            variant="default"
            onClick={handleExecuteUndo}
            className="h-7 text-xs font-black gap-1.5"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </Button>
        </div>
      )}

      {/* New Routine Modal */}
      <Dialog open={showNewRoutineModal} onOpenChange={setShowNewRoutineModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Create New Destination</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Destination Name</label>
              <Input
                value={customRoutineName}
                onChange={(e) => setCustomRoutineName(e.target.value)}
                placeholder="e.g. Work, Gym, Library, Hiking..."
                className="font-bold"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Icon Symbol</label>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIconPickerTarget("newRoutine");
                  setShowIconPicker(true);
                }}
                className="w-full justify-start gap-2 font-bold"
              >
                <span>{renderRoutineIcon(customRoutineIcon)}</span>
                <span className="capitalize">{customRoutineIcon}</span>
              </Button>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowNewRoutineModal(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!customRoutineName.trim()} onClick={handleCreateRoutine}>
              Create Destination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Routine Modal */}
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
                    const rIndex = routinesList.findIndex(
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
                            rIndex === -1 || rIndex >= routinesList.length - 1
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
                      await updateRoutine({
                        id: manageRoutine._id,
                        name: editModalName.trim(),
                        icon: editModalIconTag || manageRoutine.icon,
                      });
                      const oldName = manageRoutine.name;
                      if (effectiveRoutine === oldName) {
                        setSelectedRoutine(editModalName.trim());
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
                        await deleteRoutine({ id: routineToDeleteId });
                        const remaining = routinesList.filter(
                          (r) => r._id !== routineToDeleteId
                        );
                        if (
                          selectedRoutine === routineToDeleteName ||
                          effectiveRoutine === routineToDeleteName
                        ) {
                          setSelectedRoutine(
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

      {/* Edit Item Modal */}
      {manageItem && (
        <Dialog open={!!manageItem} onOpenChange={() => setManageItem(null)}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle className="text-base font-black">Edit Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Item Name</label>
                <Input
                  value={editModalName}
                  onChange={(e) => setEditModalName(e.target.value)}
                  className="font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Icon</label>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setIconPickerTarget("editItem");
                      setShowIconPicker(true);
                    }}
                    className="w-full justify-start gap-2 font-bold text-xs"
                  >
                    <span>{renderItemIcon(editModalIconTag || editModalName)}</span>
                    <span className="capitalize">{editModalIconTag || "Default"}</span>
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Quantity</label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={editModalQuantity ?? ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setEditModalQuantity(isNaN(val) ? undefined : val);
                    }}
                    placeholder="1"
                    className="font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Location Note</label>
                <Input
                  value={editModalLocationNote}
                  onChange={(e) => setEditModalLocationNote(e.target.value)}
                  placeholder="e.g. Front desk, Backpack side pocket"
                  className="font-bold text-xs"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs font-bold text-destructive">Remove Item</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteItemWithUndo(manageItem)}
                  className="h-8 text-xs font-bold"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setManageItem(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (!editModalName.trim()) return;
                  await editItemMutation({
                    id: manageItem._id,
                    name: editModalName.trim(),
                    emoji: editModalIconTag || undefined,
                    quantity: editModalQuantity,
                    locationNote: editModalLocationNote.trim() || undefined,
                  });
                  setManageItem(null);
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Clear All Items Confirmation */}
      <Dialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Clear Checklist Items</span>
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

      {/* Icon Picker Modal */}
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
          if (iconPickerTarget === "newItem") {
            setNewItemTag(iconKey);
          } else if (iconPickerTarget === "editItem") {
            setEditModalIconTag(iconKey);
          } else if (iconPickerTarget === "newRoutine") {
            setCustomRoutineIcon(iconKey);
          } else if (iconPickerTarget === "editRoutine") {
            setEditModalIconTag(iconKey);
          }
          setShowIconPicker(false);
        }}
      />

      {/* Smart Presets Modal */}
      <SmartPresetsModal
        open={showPresetsModal}
        onOpenChange={setShowPresetsModal}
        currentRoutine={effectiveRoutine}
        onSelectPreset={handleSelectPreset}
      />

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        routineName={effectiveRoutine}
        items={items}
      />

      {/* Share Routine Modal */}
      <ShareRoutineModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        routineName={effectiveRoutine}
        routineIcon={currentRoutineObj?.icon || "tag"}
        items={items}
      />

      {/* Routine Schedule Modal */}
      <RoutineScheduleModal
        open={showScheduleModal}
        onOpenChange={(open) => {
          setShowScheduleModal(open);
          if (!open) setManageRoutine(null);
        }}
        routineName={manageRoutine?.name || effectiveRoutine}
        initialTime={manageRoutine?.autoResetTime || (manageRoutine ? undefined : currentRoutineObj?.autoResetTime)}
        initialDays={manageRoutine?.autoResetDays || (manageRoutine ? undefined : currentRoutineObj?.autoResetDays)}
        onSaveSchedule={async (time, days) => {
          const target = manageRoutine || currentRoutineObj;
          if (target) {
            await updateRoutine({
              id: target._id,
              name: target.name,
              icon: target.icon,
              autoResetTime: time,
              autoResetDays: days,
            });
            setShowScheduleModal(false);
            setManageRoutine(null);
          }
        }}
      />

      {/* Import Shared Modal */}
      <ImportSharedModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        data={sharedImportData}
        onConfirmImport={async () => {
          if (!sharedImportData) return;
          await addRoutine({
            name: sharedImportData.name,
            icon: sharedImportData.icon || "tag",
          });
          for (const it of sharedImportData.items) {
            await addItem({
              routine: sharedImportData.name,
              name: it.name,
              emoji: it.emoji,
              quantity: it.quantity,
              locationNote: it.locationNote,
            });
          }
          setSelectedRoutine(sharedImportData.name);
          setShowImportModal(false);
        }}
      />
    </>
  );
}
