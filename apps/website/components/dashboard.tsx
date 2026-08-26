"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { UserButton } from "@clerk/nextjs"
import {
  Check,
  PackageCheck,
  ShieldCheck,
  Plus,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Tag,
  GitBranch,
  Info,
  ExternalLink,
  GripVertical,
  AlertTriangle,
  Settings,
  Sparkles,
  Share2,
  Download,
  Clock,
  Undo2,
  Compass,
  MapPin,
  Menu,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  renderRoutineIcon,
  renderItemIcon,
  IconPickerModal,
} from "@/components/icon-picker-modal"
import { SmartPresetsModal } from "@/components/smart-presets-modal"
import { SmartIntelligenceBanner } from "@/components/smart-intelligence-banner"
import { WeatherAlertBanner } from "@/components/weather-alert-banner"
import { ExportModal } from "@/components/export-modal"
import { ShareRoutineModal } from "@/components/share-routine-modal"
import { RoutineScheduleModal } from "@/components/routine-schedule-modal"
import { ImportSharedModal } from "@/components/import-shared-modal"
import {
  SMART_PRESETS,
  parseMultiItemInput,
  detectIconForItem,
  PresetRoutine,
} from "@/lib/presets"

interface RestorableItem {
  routine: string
  name: string
  isPacked: boolean
  emoji?: string
  quantity?: number
  locationNote?: string
  order?: number
}

export function Dashboard() {
  const [selectedRoutine, setSelectedRoutine] = useState<string>("")
  const [showNewRoutineModal, setShowNewRoutineModal] = useState(false)
  const [customRoutineName, setCustomRoutineName] = useState("")
  const [customRoutineIcon, setCustomRoutineIcon] = useState("tag")
  const [newCustomItemName, setNewCustomItemName] = useState("")
  const [newItemTag, setNewItemTag] = useState("")

  // Modal active configuration states
  const [manageRoutine, setManageRoutine] = useState<{
    _id: Id<"routines">
    name: string
    icon: string
    autoResetTime?: string
    autoResetDays?: number[]
    order?: number
  } | null>(null)

  const [manageItem, setManageItem] = useState<{
    _id: Id<"items">
    name: string
    emoji?: string
    quantity?: number
    locationNote?: string
    isPacked: boolean
    order?: number
  } | null>(null)

  const [editModalName, setEditModalName] = useState("")
  const [editModalIconTag, setEditModalIconTag] = useState("")
  const [editModalQuantity, setEditModalQuantity] = useState<
    number | undefined
  >(undefined)
  const [editModalLocationNote, setEditModalLocationNote] = useState("")

  const [showAboutDialog, setShowAboutDialog] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showPresetsModal, setShowPresetsModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return !!params.get("import")
    }
    return false
  })
  const [sharedImportData] = useState<{
    name: string
    icon: string
    items: Array<{
      name: string
      emoji?: string
      quantity?: number
      locationNote?: string
    }>
  } | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const importParam = params.get("import")
      if (importParam) {
        try {
          const decoded = JSON.parse(
            decodeURIComponent(escape(atob(decodeURIComponent(importParam))))
          )
          if (decoded && decoded.name && Array.isArray(decoded.items)) {
            return decoded
          }
        } catch {
          // ignore
        }
      }
    }
    return null
  })

  // Floating Undo Toast State
  const [undoToast, setUndoToast] = useState<{
    message: string
    items: RestorableItem[]
  } | null>(null)
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Keyboard navigation highlight
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(-1)
  const itemInputRef = useRef<HTMLInputElement>(null)

  // Convex mutations & queries
  const ensureInitialized = useMutation(api.pocketcheck.ensureInitialized)
  const addRoutine = useMutation(api.pocketcheck.addRoutine)
  const updateRoutine = useMutation(api.pocketcheck.updateRoutine)
  const deleteRoutine = useMutation(api.pocketcheck.deleteRoutine)
  const addItem = useMutation(api.pocketcheck.addItem)
  const addItemsBatch = useMutation(api.pocketcheck.addItemsBatch)
  const applyPreset = useMutation(api.pocketcheck.applyPreset)
  const editItemMutation = useMutation(api.pocketcheck.editItem)
  const toggleItem = useMutation(api.pocketcheck.toggleItem)
  const deleteItem = useMutation(api.pocketcheck.deleteItem)
  const resetItems = useMutation(api.pocketcheck.resetItems)
  const deleteAllItems = useMutation(api.pocketcheck.deleteAllItems)
  const restoreItems = useMutation(api.pocketcheck.restoreItems)
  const checkAndExecuteAutoReset = useMutation(
    api.pocketcheck.checkAndExecuteAutoReset
  )
  const reorderItems = useMutation(api.pocketcheck.reorderItems)
  const reorderRoutines = useMutation(api.pocketcheck.reorderRoutines)

  const customRoutines = useQuery(api.pocketcheck.listRoutines)
  const isRoutinesLoading = customRoutines === undefined
  const routinesList = useMemo(() => customRoutines ?? [], [customRoutines])
  const currentRoutineObj =
    routinesList.find((r) => r.name === selectedRoutine) ||
    (routinesList.length > 0 ? routinesList[0] : null)
  const effectiveRoutine = currentRoutineObj ? currentRoutineObj.name : ""

  const rawItems = useQuery(
    api.pocketcheck.listItems,
    effectiveRoutine ? { routine: effectiveRoutine } : "skip"
  )
  const isItemsLoading = effectiveRoutine ? rawItems === undefined : false
  const items = rawItems ?? []

  // Filter & Drag State
  const [filter, setFilter] = useState<"all" | "packed" | "missing">("all")
  const [draggedItemId, setDraggedItemId] = useState<Id<"items"> | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<Id<"items"> | null>(null)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconPickerTarget, setIconPickerTarget] = useState<
    "newItem" | "editItem" | "newRoutine" | "editRoutine"
  >("newItem")

  // Seed default routines on first login
  useEffect(() => {
    void ensureInitialized()
  }, [ensureInitialized])

  // Auto-Reset Time check per routine
  useEffect(() => {
    if (!currentRoutineObj || !currentRoutineObj.autoResetTime) return

    const checkSchedule = async () => {
      const now = new Date()
      const currentDay = now.getDay()
      const activeDays = currentRoutineObj.autoResetDays ?? [1, 2, 3, 4, 5]

      if (!activeDays.includes(currentDay)) return

      const [hours, minutes] = currentRoutineObj
        .autoResetTime!.split(":")
        .map(Number)
      const scheduledTime = new Date()
      scheduledTime.setHours(hours, minutes, 0, 0)

      const todayStr = now.toISOString().split("T")[0]
      if (
        now >= scheduledTime &&
        currentRoutineObj.lastResetDate !== todayStr
      ) {
        try {
          await checkAndExecuteAutoReset({
            routineId: currentRoutineObj._id,
            currentDateStr: todayStr,
          })
        } catch (err) {
          console.warn("Auto-reset execution failed", err)
        }
      }
    }

    void checkSchedule()
    const timer = setInterval(checkSchedule, 30000)
    return () => clearInterval(timer)
  }, [currentRoutineObj, checkAndExecuteAutoReset])

  // Filtered items list
  const filteredItems = items.filter((item) => {
    if (filter === "packed") return item.isPacked
    if (filter === "missing") return !item.isPacked
    return true
  })

  // Handlers
  const handleToggle = useCallback(
    async (itemId: Id<"items">, currentPacked: boolean) => {
      try {
        await toggleItem({ id: itemId, isPacked: !currentPacked })
      } catch (err) {
        console.error("Failed to toggle item", err)
      }
    },
    [toggleItem]
  )

  const handleReset = useCallback(async () => {
    if (!effectiveRoutine) return
    try {
      await resetItems({ routine: effectiveRoutine })
    } catch (err) {
      console.error("Failed to reset list", err)
    }
  }, [resetItems, effectiveRoutine])

  // Keyboard navigation shortcut handler (UX-02)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus single item input bar (Ctrl+K or Cmd+K or 'N' when not typing)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        itemInputRef.current?.focus()
        itemInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
        return
      }

      // If active element is an input, skip global shortcuts
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Space: Toggle active highlighted item or first missing
      if (e.code === "Space") {
        e.preventDefault()
        if (focusedItemIndex >= 0 && focusedItemIndex < filteredItems.length) {
          const item = filteredItems[focusedItemIndex]
          void handleToggle(item._id, item.isPacked)
        } else if (filteredItems.length > 0) {
          const firstMissing =
            filteredItems.find((i) => !i.isPacked) || filteredItems[0]
          void handleToggle(firstMissing._id, firstMissing.isPacked)
        }
      }

      // J or Down Arrow: Navigate down list
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault()
        setFocusedItemIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        )
      }

      // K or Up Arrow: Navigate up list
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault()
        setFocusedItemIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        )
      }

      // Shift + U: Reset all items in current routine
      if (e.shiftKey && e.key.toLowerCase() === "u") {
        e.preventDefault()
        void handleReset()
      }

      // Numbers 1-9: Switch routine tab
      const num = parseInt(e.key, 10)
      if (!isNaN(num) && num >= 1 && num <= routinesList.length) {
        e.preventDefault()
        setSelectedRoutine(routinesList[num - 1].name)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [filteredItems, focusedItemIndex, routinesList, handleToggle, handleReset])

  // Trigger floating Undo toast (UX-01)
  const triggerUndo = (message: string, itemsToRestore: RestorableItem[]) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    setUndoToast({ message, items: itemsToRestore })
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null)
    }, 5000)
  }

  const handleExecuteUndo = async () => {
    if (!undoToast || undoToast.items.length === 0) return
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    try {
      await restoreItems({ items: undoToast.items })
      setUndoToast(null)
    } catch (err) {
      console.error("Failed to restore items", err)
    }
  }

  const handleDeleteItemWithUndo = async (item: {
    _id: Id<"items">
    name: string
    emoji?: string
    quantity?: number
    locationNote?: string
    isPacked: boolean
    order?: number
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
      }
      await deleteItem({ id: item._id })
      setManageItem(null)
      triggerUndo(`Deleted "${item.name}"`, [restorable])
    } catch (err) {
      console.error("Failed to delete item", err)
    }
  }

  const handleDeleteAllCreatedItems = async () => {
    if (!effectiveRoutine) return
    try {
      const backupItems: RestorableItem[] = items.map((i) => ({
        routine: effectiveRoutine,
        name: i.name,
        isPacked: i.isPacked,
        emoji: i.emoji,
        quantity: i.quantity,
        locationNote: i.locationNote,
        order: i.order,
      }))
      await deleteAllItems({ routine: effectiveRoutine })
      setShowDeleteAllConfirm(false)
      if (backupItems.length > 0) {
        triggerUndo(
          `Cleared ${backupItems.length} items from ${effectiveRoutine}`,
          backupItems
        )
      }
    } catch (err) {
      console.error("Failed to delete all items", err)
    }
  }

  // Calculate progress metrics
  const totalItems = items.length
  const packedItems = items.filter((i) => i.isPacked).length
  const missingItems = totalItems - packedItems
  const percentage = totalItems > 0 ? (packedItems / totalItems) * 100 : 0

  // Headline message
  let headline = "Let's double-check before you pack!"
  if (!effectiveRoutine) {
    headline = "No destinations created yet."
  } else if (totalItems === 0) {
    headline = "Your pocket list is empty. Add items below!"
  } else if (packedItems === totalItems) {
    headline = "Excellent! You are 100% prepared to leave!"
  } else if (percentage >= 50) {
    headline = "Looking good! Keep grabbing those items!"
  }

  const handleDropItem = async (targetId: Id<"items">) => {
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null)
      setDragOverItemId(null)
      return
    }

    const sourceIndex = items.findIndex((i) => i._id === draggedItemId)
    const targetIndex = items.findIndex((i) => i._id === targetId)

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null)
      setDragOverItemId(null)
      return
    }

    try {
      const ids = items.map((i) => i._id)
      const [moved] = ids.splice(sourceIndex, 1)
      ids.splice(targetIndex, 0, moved)
      await reorderItems({ ids })
    } catch (err) {
      console.error("Failed to reorder item via drag & drop", err)
    } finally {
      setDraggedItemId(null)
      setDragOverItemId(null)
    }
  }

  const handleMoveItemById = async (id: Id<"items">, direction: -1 | 1) => {
    const index = items.findIndex((i) => i._id === id)
    if (index === -1) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= items.length) return
    try {
      const ids = items.map((i) => i._id)
      const [moved] = ids.splice(index, 1)
      ids.splice(targetIndex, 0, moved)
      await reorderItems({ ids })
    } catch (err) {
      console.error("Failed to reorder item", err)
    }
  }

  const handleMoveRoutineById = async (
    id: Id<"routines">,
    direction: -1 | 1
  ) => {
    const index = routinesList.findIndex((r) => r._id === id)
    if (index === -1) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= routinesList.length) return
    try {
      const ids = routinesList.map((r) => r._id)
      const [moved] = ids.splice(index, 1)
      ids.splice(targetIndex, 0, moved)
      await reorderRoutines({ ids })
    } catch (err) {
      console.error("Failed to reorder routine", err)
    }
  }

  const handleSelectPreset = async (
    preset: PresetRoutine,
    targetRoutine?: string
  ) => {
    const routineNameToUse = targetRoutine || preset.name
    setSelectedRoutine(routineNameToUse)

    try {
      const res = await applyPreset({
        name: preset.name,
        icon: preset.icon,
        items: preset.items.map((i) => ({
          name: i.name,
          ...(i.emoji ? { emoji: i.emoji } : {}),
        })),
        targetRoutine: targetRoutine,
      })
      if (res?.routineName) {
        setSelectedRoutine(res.routineName)
      }
    } catch (err) {
      console.warn("applyPreset fallback", err)
      const existingRoutine = routinesList.find(
        (r) =>
          r.name.toLowerCase().trim() === routineNameToUse.toLowerCase().trim()
      )
      if (!existingRoutine) {
        await addRoutine({
          name: routineNameToUse,
          icon: preset.icon,
        })
      }
      setSelectedRoutine(routineNameToUse)

      const existingNames = new Set(
        items.map((i) => i.name.toLowerCase().trim())
      )
      for (const item of preset.items) {
        if (!existingNames.has(item.name.toLowerCase().trim())) {
          await addItem({
            routine: routineNameToUse,
            name: item.name,
            emoji: item.emoji,
          })
        }
      }
    }
  }

  const handleCreateRoutine = async () => {
    if (!customRoutineName.trim()) return
    const routineName = customRoutineName.trim()
    const routineIcon = customRoutineIcon || "pin"
    try {
      await addRoutine({
        name: routineName,
        icon: routineIcon,
      })
      setSelectedRoutine(routineName)
      setCustomRoutineName("")
      setCustomRoutineIcon("tag")
      setShowNewRoutineModal(false)
    } catch (err) {
      console.error("Failed to create routine", err)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveRoutine) return
    const trimmed = newCustomItemName.trim()
    if (!trimmed) return

    const selectedTag = newItemTag.trim()
    const parsed = parseMultiItemInput(trimmed, selectedTag)
    if (parsed.length === 0) return

    setNewCustomItemName("")
    setNewItemTag("")

    if (parsed.length > 1) {
      const itemsToInsert = parsed.map((item) => ({
        name: item.name,
        emoji:
          selectedTag || item.emoji || detectIconForItem(item.name) || "Tag",
      }))

      try {
        await addItemsBatch({
          routine: effectiveRoutine,
          items: itemsToInsert,
        })
      } catch (err) {
        console.warn("addItemsBatch fallback", err)
        for (const item of itemsToInsert) {
          await addItem({
            routine: effectiveRoutine,
            name: item.name,
            emoji: item.emoji,
          })
        }
      }
      return
    }

    // Single item add
    const single = parsed[0]
    const detectedEmoji =
      selectedTag || single.emoji || detectIconForItem(single.name) || "Tag"

    try {
      await addItem({
        routine: effectiveRoutine,
        name: single.name,
        emoji: detectedEmoji,
      })
    } catch (err) {
      console.error("Failed to add item", err)
    }
  }

  // Auto-detected icon while user is typing in input (UX-04)
  const liveDetectedIcon =
    newItemTag ||
    (newCustomItemName.trim()
      ? detectIconForItem(newCustomItemName.trim())
      : null)

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3.5 lg:px-8">
          <div className="flex shrink-0 items-center gap-2 select-none sm:gap-3">
            <div className="overflow-hidden rounded-xl border border-border shadow-xs">
              <img
                src="/icon-192.png"
                alt="PocketChecker"
                className="h-7 w-7 object-contain sm:h-9 sm:w-9"
              />
            </div>
            <div>
              <h1 className="text-base leading-none font-black tracking-tight text-foreground sm:text-xl md:text-2xl">
                POCKET<span className="text-primary">CHECKER</span>
              </h1>
            </div>
          </div>

          {/* Active Routine Pill on Desktop */}
          {effectiveRoutine ? (
            <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/60 px-3.5 py-1.5 text-xs font-extrabold select-none md:flex">
              <span className="text-muted-foreground">Active:</span>
              <span className="flex items-center gap-1.5 font-black text-foreground">
                {renderRoutineIcon(currentRoutineObj?.icon || effectiveRoutine)}
                <span>{effectiveRoutine}</span>
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-bold text-muted-foreground">
                {packedItems}/{totalItems} Packed
              </span>
            </div>
          ) : null}

          {/* Action and Utility Buttons */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Desktop Routine Actions */}
            {effectiveRoutine ? (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                  className="h-8 cursor-pointer items-center gap-1.5 border-border text-xs font-bold text-foreground hover:bg-muted"
                  title="Export or Print Checklist"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                  className="h-8 cursor-pointer items-center gap-1.5 border-border text-xs font-bold text-foreground hover:bg-muted"
                  title="Share Checklist Link"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </Button>

                <div className="mx-0.5 h-4 w-px bg-border" />
              </div>
            ) : null}

            {/* Desktop About Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAboutDialog(true)}
              title="About PocketChecker"
              className="hidden h-8 w-8 cursor-pointer rounded-lg text-foreground hover:bg-muted sm:inline-flex sm:h-9 sm:w-9"
            >
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">About</span>
            </Button>

            {/* Mobile Actions Menu Trigger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(true)}
              title="More Options"
              className="h-8 w-8 cursor-pointer rounded-lg text-foreground hover:bg-muted sm:hidden"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open Menu</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Account Avatar with safe padding and shrink-0 */}
            <div className="flex shrink-0 items-center justify-center pl-0.5">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-12 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column / Sidebar (lg:col-span-4 space-y-6 lg:sticky lg:top-24) */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
            {/* 1. Progress Status Block */}
            <Card className="overflow-hidden border-border shadow-xs">
              <CardContent className="space-y-4 p-5">
                {isRoutinesLoading ? (
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-5 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
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
                            variant={
                              percentage === 100 ? "default" : "secondary"
                            }
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
                        className="h-8 cursor-pointer gap-1.5 rounded-lg px-2.5 text-[11px] font-black tracking-wider text-primary uppercase hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Reset items in this routine to Missing position (Shift+U)"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Uncheck All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!effectiveRoutine || totalItems === 0}
                        onClick={() => setShowDeleteAllConfirm(true)}
                        className="h-8 cursor-pointer gap-1.5 rounded-lg px-2.5 text-[11px] font-black tracking-wider text-destructive uppercase hover:text-destructive/80 disabled:cursor-not-allowed disabled:opacity-40"
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
                  <Skeleton className="h-5 w-12 rounded-full" />
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
                    <Compass className="mb-1.5 h-6 w-6 text-muted-foreground opacity-60" />
                    <p className="text-xs font-bold text-foreground">
                      No destinations yet
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Add a destination or choose a preset below.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop vertical list view */}
                    <div className="hidden flex-col gap-1.5 lg:flex">
                      {routinesList.map((routine) => {
                        const isActive = routine.name === effectiveRoutine
                        return (
                          <div
                            key={routine.name}
                            onClick={() => {
                              setSelectedRoutine(routine.name)
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
                                {renderRoutineIcon(
                                  routine.icon || routine.name
                                )}
                              </div>
                              <div className="min-w-0 truncate">
                                <span className="block truncate text-sm select-none">
                                  {routine.name}
                                </span>
                                {routine.autoResetTime && (
                                  <span className="flex items-center gap-1 font-mono text-[10px] opacity-70">
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
                                  e.stopPropagation()
                                  setManageRoutine(routine)
                                  setShowScheduleModal(true)
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
                                  e.stopPropagation()
                                  setManageRoutine(routine)
                                  setEditModalName(routine.name)
                                  setEditModalIconTag(routine.icon)
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
                        )
                      })}
                    </div>

                    {/* Mobile / Tablet grid view */}
                    <div className="grid grid-cols-3 gap-2 lg:hidden">
                      {routinesList.map((routine) => {
                        const isActive = routine.name === effectiveRoutine
                        return (
                          <div key={routine.name} className="relative">
                            <Button
                              variant={isActive ? "default" : "outline"}
                              onClick={() => {
                                setSelectedRoutine(routine.name)
                              }}
                              className="flex h-auto w-full flex-col items-center gap-1.5 rounded-lg p-3 pt-4 text-xs font-black"
                            >
                              <span className="block select-none">
                                {renderRoutineIcon(
                                  routine.icon || routine.name
                                )}
                              </span>
                              <span className="max-w-full truncate select-none">
                                {routine.name}
                              </span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                setManageRoutine(routine)
                                setEditModalName(routine.name)
                                setEditModalIconTag(routine.icon)
                              }}
                              className="absolute top-1 right-1 h-5 w-5 rounded-md bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                              title="Control"
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* Destination Actions: Smart Presets & New Destination */}
                <div className="mt-2 flex flex-col gap-1.5">
                  <Button
                    variant="outline"
                    onClick={() => setShowPresetsModal(true)}
                    className="h-10 w-full cursor-pointer justify-center gap-2 rounded-lg text-xs font-black tracking-wider text-primary uppercase hover:bg-primary/10"
                    title="Choose from smart presets (Campus, Work, Travel)"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Smart Presets</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setCustomRoutineName("")
                      setCustomRoutineIcon("tag")
                      setShowNewRoutineModal(true)
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

          {/* Right Column / Workspace (lg:col-span-8 space-y-5) */}
          <div className="space-y-5 lg:col-span-8">
            {isRoutinesLoading ? (
              <div className="space-y-5">
                {/* Header Skeleton */}
                <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-36 rounded-md" />
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-64 rounded-lg" />
                </div>

                {/* Quick Add Bar Skeleton */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-11 w-12 rounded-lg" />
                    <Skeleton className="h-11 flex-1 rounded-lg" />
                    <Skeleton className="h-11 w-28 rounded-lg" />
                  </div>
                </div>

                {/* Items List Skeletons */}
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardContent className="flex flex-row items-center justify-between gap-3 p-3.5">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                          <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <Skeleton className="h-5 w-32 rounded-md sm:w-40" />
                            <Skeleton className="h-3.5 w-16 rounded-full" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : !effectiveRoutine ? (
              <Card className="border-border shadow-xs">
                <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <h2 className="mb-1 text-xl font-black text-foreground sm:text-2xl">
                    Ready to Start Packing?
                  </h2>
                  <p className="mb-6 max-w-md text-sm font-medium text-muted-foreground">
                    Create your first destination or choose from smart presets
                    like Work, Gym, Campus, or Travel to organize your essential
                    gear.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      onClick={() => setShowPresetsModal(true)}
                      className="h-10 cursor-pointer bg-primary px-5 text-xs font-black tracking-wider text-primary-foreground uppercase hover:bg-primary/90"
                    >
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      Browse Smart Presets
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCustomRoutineName("")
                        setCustomRoutineIcon("tag")
                        setShowNewRoutineModal(true)
                      }}
                      className="h-10 cursor-pointer px-5 text-xs font-black tracking-wider uppercase"
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Create Custom Destination
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Active Destination Workspace Card Header */}
                <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary sm:p-3">
                      {renderRoutineIcon(
                        currentRoutineObj?.icon || effectiveRoutine
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-lg font-black text-foreground sm:text-2xl">
                          {effectiveRoutine}
                        </h2>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs font-black"
                        >
                          {items.length} items
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">
                        {packedItems} packed &bull; {missingItems} remaining
                      </p>
                    </div>
                  </div>

                  {/* Filter Segmented Control */}
                  <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-muted/60 p-1 select-none sm:w-80">
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
                      <Badge
                        variant="secondary"
                        className="rounded-md px-1.5 py-0 text-[10px] font-extrabold"
                      >
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
                      <Badge
                        variant="destructive"
                        className="rounded-md px-1.5 py-0 text-[10px] font-extrabold"
                      >
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
                      <Badge
                        variant="default"
                        className="rounded-md px-1.5 py-0 text-[10px] font-extrabold"
                      >
                        {packedItems}
                      </Badge>
                    </button>
                  </div>
                </div>

                {/* Free Weather-Aware Packing Suggestions Banner (FEAT-01) */}
                <WeatherAlertBanner
                  currentRoutineItems={items}
                  onQuickAddItem={async (name, emoji) => {
                    await addItem({
                      routine: effectiveRoutine,
                      name,
                      emoji: emoji || "Umbrella",
                    })
                  }}
                />

                {/* Smart Departure Intelligence Banner (UX-05) */}
                <SmartIntelligenceBanner
                  routineName={effectiveRoutine}
                  items={items}
                  onQuickPack={async (id) => {
                    await handleToggle(id, false)
                  }}
                />

                {/* Quick Add Item Bar with Live Auto-Icon Detection (UX-03, UX-04) */}
                <Card className="border-border shadow-xs">
                  <CardContent className="space-y-2 p-3.5 sm:p-4">
                    <form
                      onSubmit={(e) => {
                        void handleAddItem(e)
                      }}
                      className="flex flex-col items-center gap-2.5 sm:flex-row"
                    >
                      <div className="flex w-full gap-2 sm:flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIconPickerTarget("newItem")
                            setShowIconPicker(true)
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
                          placeholder={`Add item(s) to ${effectiveRoutine} (e.g. Keys, Wallet or USB Cable, Notebook, ID Card)...`}
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
                            )
                            if (parsed.length > 1) {
                              return `Add ${parsed.length} Items`
                            }
                            return "Add Item"
                          })()}
                        </Button>
                      </div>
                    </form>

                    {/* Live preview for multi-item comma entry */}
                    {(() => {
                      const parsed = parseMultiItemInput(
                        newCustomItemName,
                        newItemTag
                      )
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
                        )
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
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Items List */}
                {(() => {
                  return (
                    <div className="space-y-3" id="checklist-container">
                      {isItemsLoading ? (
                        [1, 2, 3].map((i) => (
                          <Card key={i}>
                            <CardContent className="flex flex-row items-center justify-between gap-3 p-3.5">
                              <div className="flex min-w-0 flex-1 items-center gap-3 select-none">
                                <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                                <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <Skeleton className="h-5 w-28 rounded-md sm:w-36" />
                                  <Skeleton className="h-3.5 w-14 rounded-full" />
                                </div>
                              </div>
                              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                            </CardContent>
                          </Card>
                        ))
                      ) : filteredItems.length === 0 ? (
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
                              <p className="max-w-md text-xs text-muted-foreground">
                                {filter === "all"
                                  ? "Add items above or quick-start with one of our smart presets below:"
                                  : filter === "packed"
                                    ? "Click items to mark them as packed!"
                                    : "Great job, you are 100% set to go!"}
                              </p>
                            </div>
                            {filter === "all" && (
                              <div className="space-y-2 pt-1">
                                <p className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                                  Start with a Smart Preset:
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                  {SMART_PRESETS.map((preset) => (
                                    <Button
                                      key={preset.id}
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        void handleSelectPreset(
                                          preset,
                                          effectiveRoutine
                                        )
                                      }
                                      className="h-8 cursor-pointer gap-1.5 rounded-lg border-border font-extrabold hover:border-primary hover:bg-primary/5 hover:text-primary"
                                    >
                                      {renderRoutineIcon(preset.icon)}
                                      <span>{preset.name}</span>
                                      <Badge
                                        variant="secondary"
                                        className="ml-0.5 px-1 py-0 text-[9px] font-black"
                                      >
                                        {preset.items.length}
                                      </Badge>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        filteredItems.map((item, itemIdx) => {
                          const isDragging = draggedItemId === item._id
                          const isDragOver = dragOverItemId === item._id
                          const isFocused = focusedItemIndex === itemIdx

                          return (
                            <Card
                              key={item._id}
                              draggable
                              onDragStart={(e) => {
                                setDraggedItemId(item._id)
                                e.dataTransfer.effectAllowed = "move"
                                e.dataTransfer.setData("text/plain", item._id)
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                                if (
                                  draggedItemId &&
                                  draggedItemId !== item._id
                                ) {
                                  setDragOverItemId(item._id)
                                }
                              }}
                              onDragLeave={() => {
                                if (dragOverItemId === item._id) {
                                  setDragOverItemId(null)
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                void handleDropItem(item._id)
                              }}
                              onDragEnd={() => {
                                setDraggedItemId(null)
                                setDragOverItemId(null)
                              }}
                              onClick={() => {
                                setFocusedItemIndex(itemIdx)
                                void handleToggle(item._id, item.isPacked)
                              }}
                              className={`relative cursor-pointer transition-all ${
                                item.isPacked
                                  ? "bg-muted/40"
                                  : "hover:bg-accent/40"
                              } ${
                                isFocused
                                  ? "ring-2 ring-primary ring-offset-1"
                                  : ""
                              } ${
                                isDragging
                                  ? "scale-[0.98] border-dashed border-primary opacity-40"
                                  : ""
                              } ${
                                isDragOver
                                  ? "scale-[1.01] ring-2 ring-primary ring-offset-2"
                                  : ""
                              }`}
                            >
                              <CardContent className="flex flex-row items-center justify-between gap-3 p-3.5">
                                <div className="flex min-w-0 flex-1 items-center gap-3 select-none">
                                  {/* Drag Handle */}
                                  <div
                                    className="shrink-0 cursor-grab rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground active:cursor-grabbing"
                                    title="Drag to reorder"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>

                                  {/* Checkbox */}
                                  <div
                                    className={`checkbox-ui flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all select-none ${
                                      item.isPacked
                                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                        : "border-border bg-card hover:border-primary/60"
                                    }`}
                                  >
                                    {item.isPacked && (
                                      <Check className="h-4 w-4 stroke-[3]" />
                                    )}
                                  </div>

                                  {/* Details (Item Name, Quantities FEAT-03, Placement Notes) */}
                                  <div className="min-w-0 flex-1 space-y-0.5 select-none">
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`item-name flex items-center truncate text-base font-extrabold select-none sm:text-lg ${
                                          item.isPacked
                                            ? "text-muted-foreground line-through decoration-muted-foreground decoration-2"
                                            : "text-foreground"
                                        }`}
                                      >
                                        {renderItemIcon(item.emoji)}
                                        <span className="truncate select-none">
                                          {item.name}
                                        </span>
                                      </p>

                                      {item.quantity && item.quantity > 1 && (
                                        <span className="py-0.2 shrink-0 rounded border border-border bg-muted/60 px-1.5 font-mono text-[11px] font-bold text-foreground">
                                          {item.quantity}x
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant={
                                          item.isPacked ? "default" : "outline"
                                        }
                                        className="px-2 py-0 text-[10px] font-black"
                                      >
                                        {item.isPacked ? "Packed" : "Missing"}
                                      </Badge>

                                      {item.locationNote && (
                                        <span className="text-[11px] font-medium text-muted-foreground italic">
                                          📍 {item.locationNote}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Control settings */}
                                <div
                                  className="flex shrink-0 items-center gap-1 select-none"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setManageItem(item)
                                      setEditModalName(item.name)
                                      setEditModalIconTag(item.emoji ?? "")
                                      setEditModalQuantity(item.quantity)
                                      setEditModalLocationNote(
                                        item.locationNote ?? ""
                                      )
                                    }}
                                    className="h-8 w-8 cursor-pointer rounded-lg text-muted-foreground hover:text-primary"
                                    title="Control Item"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating Undo Toast Notification (UX-01) */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-3 rounded-xl border border-border bg-foreground px-4 py-3 text-background shadow-2xl duration-200 fade-in slide-in-from-bottom-4">
          <span className="text-xs font-bold text-background">
            {undoToast.message}
          </span>
          <Button
            size="sm"
            onClick={() => void handleExecuteUndo()}
            className="flex h-7 cursor-pointer items-center gap-1 bg-background px-3 text-xs font-black text-foreground hover:bg-background/90"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </Button>
        </div>
      )}

      {/* Manage Routine Modal */}
      <Dialog
        open={!!manageRoutine && !showScheduleModal}
        onOpenChange={(open) => !open && setManageRoutine(null)}
      >
        {manageRoutine && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Destination Settings</DialogTitle>
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
                      setIconPickerTarget("editRoutine")
                      setShowIconPicker(true)
                    }}
                    className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg px-0"
                    title="Select Destination Icon"
                  >
                    {renderRoutineIcon(editModalIconTag)}
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
                    )
                    return (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveRoutineById(manageRoutine._id, -1)
                          }}
                          disabled={rIndex <= 0}
                          className="flex-1"
                        >
                          <ChevronLeft className="h-4 w-4" /> Move Left
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveRoutineById(manageRoutine._id, 1)
                          }}
                          disabled={
                            rIndex === -1 || rIndex >= routinesList.length - 1
                          }
                          className="flex-1"
                        >
                          Move Right <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )
                  })()}
                </div>
              </div>

              <DialogFooter className="flex-col gap-2">
                <Button
                  onClick={async () => {
                    if (!editModalName.trim()) return
                    try {
                      await updateRoutine({
                        id: manageRoutine._id,
                        name: editModalName.trim(),
                        icon: editModalIconTag || "tag",
                      })
                      const oldName = manageRoutine.name
                      if (effectiveRoutine === oldName) {
                        setSelectedRoutine(editModalName.trim())
                      }
                      setManageRoutine(null)
                    } catch (err) {
                      console.error("Failed to update routine", err)
                    }
                  }}
                  className="w-full font-black tracking-wider uppercase"
                >
                  Save Changes
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
                        return
                      try {
                        const routineToDeleteName = manageRoutine.name
                        const routineToDeleteId = manageRoutine._id
                        await deleteRoutine({ id: routineToDeleteId })
                        const remaining = routinesList.filter(
                          (r) => r._id !== routineToDeleteId
                        )
                        if (
                          selectedRoutine === routineToDeleteName ||
                          effectiveRoutine === routineToDeleteName
                        ) {
                          setSelectedRoutine(
                            remaining.length > 0 ? remaining[0].name : ""
                          )
                        }
                        setManageRoutine(null)
                      } catch (err) {
                        console.error("Failed to delete routine", err)
                      }
                    }}
                    className="flex-1 text-xs font-bold tracking-wider uppercase"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Destination
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setManageRoutine(null)}
                    className="flex-1 text-xs font-bold tracking-wider uppercase"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Manage Item Modal (Quantities & Placement Notes FEAT-03) */}
      <Dialog
        open={!!manageItem}
        onOpenChange={(open) => !open && setManageItem(null)}
      >
        {manageItem && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Item Settings</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                  Item Icon & Name
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIconPickerTarget("editItem")
                      setShowIconPicker(true)
                    }}
                    className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg px-0"
                    title="Select Icon"
                  >
                    {editModalIconTag ? (
                      renderItemIcon(editModalIconTag)
                    ) : (
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Input
                    type="text"
                    value={editModalName}
                    onChange={(e) => setEditModalName(e.target.value)}
                    placeholder="Item name..."
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Quantity & Location Note Inputs (FEAT-03) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    Quantity (Optional)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={editModalQuantity ?? ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setEditModalQuantity(isNaN(val) ? undefined : val)
                    }}
                    placeholder="1"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    Location Note
                  </label>
                  <Input
                    type="text"
                    value={editModalLocationNote}
                    onChange={(e) => setEditModalLocationNote(e.target.value)}
                    placeholder="e.g. Front Pocket"
                    className="h-9 text-xs"
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
                    const iIndex = items.findIndex(
                      (i) => i._id === manageItem._id
                    )
                    return (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveItemById(manageItem._id, -1)
                          }}
                          disabled={iIndex <= 0}
                          className="flex-1"
                        >
                          <ChevronUp className="h-4 w-4" /> Move Up
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveItemById(manageItem._id, 1)
                          }}
                          disabled={iIndex === -1 || iIndex >= items.length - 1}
                          className="flex-1"
                        >
                          Move Down <ChevronDown className="h-4 w-4" />
                        </Button>
                      </>
                    )
                  })()}
                </div>
              </div>

              <DialogFooter className="flex-col gap-2">
                <Button
                  onClick={async () => {
                    if (!editModalName.trim()) return
                    try {
                      await editItemMutation({
                        id: manageItem._id,
                        name: editModalName.trim(),
                        emoji: editModalIconTag.trim() || undefined,
                        quantity: editModalQuantity,
                        locationNote: editModalLocationNote.trim() || undefined,
                      })
                      setManageItem(null)
                    } catch (err) {
                      console.error("Failed to update item", err)
                    }
                  }}
                  className="w-full font-black tracking-wider uppercase"
                >
                  Save Changes
                </Button>

                <div className="flex w-full gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteItemWithUndo(manageItem)}
                    className="flex-1 text-xs font-bold tracking-wider uppercase"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Item
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setManageItem(null)}
                    className="flex-1 text-xs font-bold tracking-wider uppercase"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Routine Schedule Auto-Reset Modal (FEAT-02) */}
      <RoutineScheduleModal
        open={showScheduleModal && !!manageRoutine}
        onOpenChange={(open) => {
          setShowScheduleModal(open)
          if (!open) setManageRoutine(null)
        }}
        routineName={manageRoutine?.name || effectiveRoutine}
        initialTime={manageRoutine?.autoResetTime}
        initialDays={manageRoutine?.autoResetDays}
        onSaveSchedule={async (time, days) => {
          if (!manageRoutine) return
          await updateRoutine({
            id: manageRoutine._id,
            name: manageRoutine.name,
            icon: manageRoutine.icon,
            autoResetTime: time,
            autoResetDays: days,
          })
        }}
      />

      {/* Universal Export & Backup Modal (FEAT-05) */}
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        routineName={effectiveRoutine}
        items={items}
      />

      {/* Share Routine Modal (FEAT-04) */}
      <ShareRoutineModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        routineName={effectiveRoutine}
        routineIcon={currentRoutineObj?.icon || "tag"}
        items={items}
      />

      {/* Import Shared Routine Modal (FEAT-04) */}
      <ImportSharedModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        data={sharedImportData}
        onConfirmImport={async () => {
          if (!sharedImportData) return
          await applyPreset({
            name: sharedImportData.name,
            icon: sharedImportData.icon || "tag",
            items: sharedImportData.items,
          })
          setSelectedRoutine(sharedImportData.name)
          if (typeof window !== "undefined") {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            )
          }
        }}
      />

      {/* Mobile Actions Drawer / Modal */}
      <Dialog open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <img
                src="/icon-192.png"
                alt="PocketChecker"
                className="h-5 w-5 rounded-md border border-border object-contain"
              />
              <span>Menu</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {effectiveRoutine && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black tracking-wider text-muted-foreground uppercase">
                    Active Destination
                  </span>
                  <Badge variant="outline" className="text-[10px] font-black">
                    {effectiveRoutine}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <Button
                    variant="outline"
                    className="h-auto w-full cursor-pointer justify-start gap-3 p-3 text-left font-bold hover:bg-muted"
                    onClick={() => {
                      setShowMobileMenu(false)
                      setShowExportModal(true)
                    }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Download className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-foreground">
                        Export Checklist
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Download Markdown, JSON, or print PDF
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto w-full cursor-pointer justify-start gap-3 p-3 text-left font-bold hover:bg-muted"
                    onClick={() => {
                      setShowMobileMenu(false)
                      setShowShareModal(true)
                    }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Share2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-foreground">
                        Share Routine
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Create a 1-click shareable link
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto w-full cursor-pointer justify-start gap-3 p-3 text-left font-bold hover:bg-muted"
                    onClick={() => {
                      setShowMobileMenu(false)
                      if (currentRoutineObj) {
                        setManageRoutine(currentRoutineObj)
                        setShowScheduleModal(true)
                      }
                    }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-foreground">
                        Schedule Auto-Reset
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Set automatic daily unchecking
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1.5 border-t border-border pt-3">
              <span className="block px-1 text-[11px] font-black tracking-wider text-muted-foreground uppercase">
                General
              </span>
              <Button
                variant="outline"
                className="h-auto w-full cursor-pointer justify-start gap-3 p-3 text-left font-bold hover:bg-muted"
                onClick={() => {
                  setShowMobileMenu(false)
                  setShowAboutDialog(true)
                }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Info className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-foreground">
                    About PocketChecker
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Version info and repository
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Project Modal */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <img
                src="/icon-192.png"
                alt="PocketChecker"
                className="h-6 w-6 rounded-md border border-border object-contain"
              />
              <span>About PocketChecker</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 select-none">
            <p className="text-sm leading-relaxed font-bold text-foreground">
              PocketChecker is an everyday carry checklist platform designed to
              ensure you never leave essential gear behind before stepping out
              for work, gym, or custom routines.
            </p>

            <a
              href="https://github.com/YogaDharma21/pocket-check"
              target="_blank"
              rel="noopener noreferrer"
              className="block pt-2"
            >
              <Button
                variant="outline"
                className="w-full gap-2 text-xs font-bold"
              >
                <GitBranch className="h-4 w-4 text-primary" />
                <span>github.com/yogaDharma21/pocket-check</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete All Items Confirmation Modal */}
      <Dialog
        open={showDeleteAllConfirm}
        onOpenChange={setShowDeleteAllConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Clear All Items
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm leading-relaxed font-bold text-foreground">
              Are you sure you want to delete all created items in{" "}
              <span className="font-black text-primary">
                &quot;{effectiveRoutine}&quot;
              </span>
              ? You will have a 5-second Undo option.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={() => void handleDeleteAllCreatedItems()}
                className="flex-1 text-xs font-black tracking-wider uppercase"
              >
                Yes, Delete All
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 text-xs font-black tracking-wider uppercase"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Smart Presets Modal */}
      <SmartPresetsModal
        open={showPresetsModal}
        onOpenChange={setShowPresetsModal}
        currentRoutine={effectiveRoutine}
        onSelectPreset={handleSelectPreset}
      />

      {/* Create New Destination Modal */}
      <Dialog
        open={showNewRoutineModal}
        onOpenChange={(open) => {
          setShowNewRoutineModal(open)
          if (!open) {
            setCustomRoutineName("")
            setCustomRoutineIcon("tag")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Plus className="h-4 w-4 text-primary" /> New Destination
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleCreateRoutine()
            }}
            className="space-y-4 py-2 select-none"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                Destination Icon & Name
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIconPickerTarget("newRoutine")
                    setShowIconPicker(true)
                  }}
                  className="flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg px-0"
                  title="Select Destination Icon"
                >
                  {renderRoutineIcon(customRoutineIcon)}
                </Button>
                <Input
                  type="text"
                  value={customRoutineName}
                  onChange={(e) => setCustomRoutineName(e.target.value)}
                  placeholder="e.g. Campus, Work, Gym, Weekend Trip..."
                  className="h-11 flex-1 text-sm font-bold"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewRoutineModal(false)}
                className="cursor-pointer text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!customRoutineName.trim()}
                className="cursor-pointer text-xs font-black uppercase"
              >
                Create Destination
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Icon Picker Modal */}
      <IconPickerModal
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        selectedKey={
          iconPickerTarget === "newItem"
            ? newItemTag
            : iconPickerTarget === "newRoutine"
              ? customRoutineIcon
              : editModalIconTag
        }
        onSelectIcon={(key) => {
          if (iconPickerTarget === "newItem") {
            setNewItemTag(key)
          } else if (iconPickerTarget === "newRoutine") {
            setCustomRoutineIcon(key)
          } else {
            setEditModalIconTag(key)
          }
        }}
      />
    </>
  )
}
