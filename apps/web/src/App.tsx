import { useEffect, useState } from "react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import {
  Check,
  CheckSquare,
  PackageCheck,
  ShieldCheck,
  MapPin,
  Briefcase,
  Dumbbell,
  Home,
  Compass,
  Settings,
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
  Filter,
  AlertTriangle,
} from "lucide-react";
import { ThemeProvider } from "./components/theme-provider";
import { ThemeToggle } from "./components/theme-toggle";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Progress } from "./components/ui/progress";
import { Badge } from "./components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./components/ui/dialog";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="pocketcheck-theme">
      <div className="bg-background text-foreground antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
        {/* Loading State */}
        <AuthLoading>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background">
            <CheckSquare className="w-16 h-16 text-primary animate-bounce" />
            <p className="font-extrabold text-xl tracking-wider text-muted-foreground animate-pulse">
              LOADING POCKETCHECK...
            </p>
          </div>
        </AuthLoading>

        {/* Unauthenticated State */}
        <Unauthenticated>
          <WelcomeScreen />
        </Unauthenticated>

        {/* Authenticated State */}
        <Authenticated>
          <Dashboard />
        </Authenticated>
      </div>
    </ThemeProvider>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 max-w-md mx-auto w-full space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-primary text-primary-foreground hover:scale-105 transition-transform cursor-pointer shadow-md">
          <PackageCheck className="w-16 h-16" />
        </div>
        <h1 className="text-4xl font-black tracking-wide text-foreground">
          POCKET<span className="text-primary">CHECK</span>
        </h1>
        <p className="text-muted-foreground font-bold text-base leading-relaxed">
          Double-check your pockets before you step out! Create packing lists for work, the gym, or your custom routines.
        </p>
      </div>

      <div className="w-full space-y-4 pt-4">
        <SignInButton mode="modal">
          <Button className="w-full py-6 rounded-2xl text-lg uppercase tracking-wider">
            Log In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="outline" className="w-full py-6 rounded-2xl text-lg uppercase tracking-wider">
            Create Account
          </Button>
        </SignUpButton>
      </div>

      <a
        href="https://github.com/YogaDharma21/pocket-check"
        target="_blank"
        rel="noopener noreferrer"
        className="pt-2 block"
      >
        <Button variant="outline" size="sm" className="gap-2 font-bold text-xs">
          <GitBranch className="w-4 h-4 text-primary" />
          <span>github.com/yogaDharma21/pocket-check</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Button>
      </a>
    </div>
  );
}

function renderRoutineIcon(iconStr: string) {
  const normalized = (iconStr || "").toLowerCase().trim();
  if (normalized.includes("work") || normalized.includes("briefcase")) {
    return <Briefcase className="w-5 h-5" />;
  }
  if (normalized.includes("gym") || normalized.includes("fitness") || normalized.includes("workout")) {
    return <Dumbbell className="w-5 h-5" />;
  }
  if (normalized.includes("home") || normalized.includes("house")) {
    return <Home className="w-5 h-5" />;
  }
  if (normalized.includes("travel") || normalized.includes("trip") || normalized.includes("compass")) {
    return <Compass className="w-5 h-5" />;
  }
  return <MapPin className="w-5 h-5" />;
}

function Dashboard() {
  const [selectedRoutine, setSelectedRoutine] = useState("Work");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customRoutineName, setCustomRoutineName] = useState("");
  const [customRoutineIcon, setCustomRoutineIcon] = useState("tag");
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [newItemTag, setNewItemTag] = useState("");

  // Modal active configuration states
  const [manageRoutine, setManageRoutine] = useState<(typeof customRoutines)[0] | null>(null);
  const [manageItem, setManageItem] = useState<(typeof items)[0] | null>(null);

  const [editModalName, setEditModalName] = useState("");
  const [editModalIconTag, setEditModalIconTag] = useState("");
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  // Convex mutations & queries
  const ensureInitialized = useMutation(api.pocketcheck.ensureInitialized);
  const addRoutine = useMutation(api.pocketcheck.addRoutine);
  const updateRoutine = useMutation(api.pocketcheck.updateRoutine);
  const deleteRoutine = useMutation(api.pocketcheck.deleteRoutine);
  const addItem = useMutation(api.pocketcheck.addItem);
  const editItemMutation = useMutation(api.pocketcheck.editItem);
  const toggleItem = useMutation(api.pocketcheck.toggleItem);
  const deleteItem = useMutation(api.pocketcheck.deleteItem);
  const resetItems = useMutation(api.pocketcheck.resetItems);
  const deleteAllItems = useMutation(api.pocketcheck.deleteAllItems);
  const resetAllRoutines = useMutation(api.pocketcheck.resetAllRoutines);
  const reorderItems = useMutation(api.pocketcheck.reorderItems);
  const reorderRoutines = useMutation(api.pocketcheck.reorderRoutines);

  const items = useQuery(api.pocketcheck.listItems, { routine: selectedRoutine }) ?? [];
  const customRoutines = useQuery(api.pocketcheck.listRoutines) ?? [];

  // Filter & Drag State
  const [filter, setFilter] = useState<"all" | "packed" | "missing">("all");
  const [draggedItemId, setDraggedItemId] = useState<Id<"items"> | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<Id<"items"> | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Seed default routines + items on first login
  useEffect(() => {
    void ensureInitialized();
  }, [ensureInitialized]);

  const routinesList = customRoutines;

  // Auto-select first available routine when current one no longer exists
  useEffect(() => {
    if (routinesList.length > 0 && !routinesList.find((r) => r.name === selectedRoutine)) {
      setSelectedRoutine(routinesList[0].name);
    }
  }, [routinesList, selectedRoutine]);

  // Calculate progress metrics
  const totalItems = items.length;
  const packedItems = items.filter((i) => i.isPacked).length;
  const percentage = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  // Headline message
  let headline = "Let's double-check before you pack!";
  if (totalItems === 0) {
    headline = "Your pocket list is empty. Add items below!";
  } else if (packedItems === totalItems) {
    headline = "Excellent! You are 100% prepared to leave!";
  } else if (percentage >= 50) {
    headline = "Looking good! Keep grabbing those items!";
  }

  // Handlers
  const handleToggle = async (itemId: Id<"items">, currentPacked: boolean) => {
    try {
      await toggleItem({ id: itemId, isPacked: !currentPacked });
    } catch (err) {
      console.error("Failed to toggle item", err);
    }
  };

  const handleReset = async () => {
    try {
      await resetItems({ routine: selectedRoutine });
    } catch (err) {
      console.error("Failed to reset list", err);
    }
  };

  const handleResetAll = async () => {
    try {
      await resetAllRoutines();
    } catch (err) {
      console.error("Failed to reset all routines", err);
    }
  };

  const handleDeleteAllCreatedItems = async () => {
    try {
      await deleteAllItems({ routine: selectedRoutine });
      setShowDeleteAllConfirm(false);
    } catch (err) {
      console.error("Failed to delete all items", err);
    }
  };

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

  const handleMoveItemById = async (id: Id<"items">, direction: -1 | 1) => {
    const index = items.findIndex((i) => i._id === id);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    try {
      const ids = items.map((i) => i._id);
      const [moved] = ids.splice(index, 1);
      ids.splice(targetIndex, 0, moved);
      await reorderItems({ ids });
    } catch (err) {
      console.error("Failed to reorder item", err);
    }
  };

  const handleMoveRoutineById = async (id: Id<"routines">, direction: -1 | 1) => {
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

  const handleCreateRoutine = async () => {
    if (!customRoutineName.trim()) return;
    try {
      await addRoutine({ name: customRoutineName.trim(), icon: customRoutineIcon || "pin" });
      setSelectedRoutine(customRoutineName.trim());
      setCustomRoutineName("");
      setCustomRoutineIcon("tag");
      setShowCustomInput(false);
    } catch (err) {
      console.error("Failed to create routine", err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomItemName.trim()) return;
    try {
      await addItem({
        routine: selectedRoutine,
        name: newCustomItemName.trim(),
        emoji: newItemTag.trim() || undefined,
      });
      setNewCustomItemName("");
      setNewItemTag("");
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  return (
    <>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 select-none">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl">
              <PackageCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-wide text-foreground">
              POCKET<span className="text-primary">CHECK</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAboutDialog(true)}
              title="About PocketCheck"
              className="w-9 h-9 rounded-xl text-foreground hover:bg-muted"
            >
              <Info className="w-5 h-5" />
              <span className="sr-only">About</span>
            </Button>
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="w-full max-w-xl mx-auto p-4 flex-1 space-y-6 pb-24 md:py-8">
        {/* ─── Progress Status Block ───────────────────────────────────── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4 select-none">
              <ShieldCheck className="w-10 h-10 text-primary shrink-0 hidden sm:block mt-1" />
              <div className="flex-1 space-y-3">
                <h2 id="status-headline" className="text-xl font-extrabold tracking-wide text-card-foreground">
                  {headline}
                </h2>
                <Progress value={percentage} />
                <p id="progress-text" className="text-sm font-bold text-muted-foreground">
                  {packedItems} of {totalItems} items safely pocketed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Routine Switcher ────────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider">
            Where are we heading today?
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {routinesList.map((routine) => {
              const isActive = routine.name === selectedRoutine;

              return (
                <div key={routine.name} className="relative">
                  <Button
                    variant={isActive ? "default" : "outline"}
                    onClick={() => {
                      setSelectedRoutine(routine.name);
                      setShowCustomInput(false);
                    }}
                    className="w-full h-auto flex flex-col items-center gap-2 p-3.5 pt-5 rounded-2xl text-sm font-black"
                  >
                    <span className="block select-none">{renderRoutineIcon(routine.name)}</span>
                    <span className="truncate max-w-full select-none">{routine.name}</span>
                  </Button>

                  {/* Settings gear button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setManageRoutine(routine);
                      setEditModalName(routine.name);
                      setEditModalIconTag(routine.icon);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                    title="Control"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}

            {/* Add custom destination button */}
            <Button
              variant={showCustomInput ? "default" : "outline"}
              onClick={() => {
                setShowCustomInput(!showCustomInput);
              }}
              className="h-auto flex flex-col items-center gap-2 p-3.5 rounded-2xl text-sm font-black"
            >
              <Plus className="w-5 h-5" />
              <span>Custom</span>
            </Button>
          </div>

          {/* New custom destination form */}
          {showCustomInput && (
            <div className="animate-fadeIn mt-2">
              <Card>
                <CardContent className="p-2 flex gap-2 items-center">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                    <Tag className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    value={customRoutineName}
                    onChange={(e) => setCustomRoutineName(e.target.value)}
                    placeholder="Name your destination..."
                    className="border-0 bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreateRoutine();
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      void handleCreateRoutine();
                    }}
                    className="uppercase tracking-wider font-extrabold shrink-0"
                  >
                    Set
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ─── Filter & Checklist Section ───────────────────────────── */}
        {(() => {
          const packedCount = items.filter((i) => i.isPacked).length;
          const missingCount = items.filter((i) => !i.isPacked).length;

          const filteredItems = items.filter((item) => {
            if (filter === "packed") return item.isPacked;
            if (filter === "missing") return !item.isPacked;
            return true;
          });

          return (
            <div className="space-y-4">
              {/* Quick Filter Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-primary" /> Filter List
                  </h3>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleReset()}
                      className="text-primary hover:text-primary/80 font-black uppercase text-[11px] tracking-wider gap-1 h-7 px-2"
                      title="Reset items in this routine to Missing position"
                    >
                      <RotateCcw className="w-3 h-3" /> Uncheck All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleResetAll()}
                      className="text-muted-foreground hover:text-foreground font-black uppercase text-[11px] tracking-wider gap-1 h-7 px-2"
                      title="Reset all items across all routines for a fresh day"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset All Routines
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteAllConfirm(true)}
                      className="text-destructive hover:text-destructive/80 font-black uppercase text-[11px] tracking-wider gap-1 h-7 px-2"
                      title="Delete all created items in this routine"
                    >
                      <Trash2 className="w-3 h-3" /> Clear List
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-2xl select-none">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      filter === "all"
                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span>All</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-extrabold rounded-md">
                      {items.length}
                    </Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("missing")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      filter === "missing"
                        ? "bg-card text-destructive shadow-sm ring-1 ring-destructive/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span>Missing</span>
                    <Badge variant="destructive" className="px-1.5 py-0 text-[10px] font-extrabold rounded-md">
                      {missingCount}
                    </Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("packed")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      filter === "packed"
                        ? "bg-card text-primary shadow-sm ring-1 ring-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span>Packed</span>
                    <Badge variant="default" className="px-1.5 py-0 text-[10px] font-extrabold rounded-md">
                      {packedCount}
                    </Badge>
                  </button>
                </div>
              </div>

              {/* Items List with Drag-and-Drop */}
              <div className="space-y-3" id="checklist-container">
                {filteredItems.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-muted-foreground text-sm font-bold">
                      {filter === "all"
                        ? "No items added to this routine yet."
                        : filter === "packed"
                        ? "No items are packed yet. Tap items to mark them as packed!"
                        : "All items are packed! Great job!"}
                    </CardContent>
                  </Card>
                ) : (
                  filteredItems.map((item) => {
                    const isDragging = draggedItemId === item._id;
                    const isDragOver = dragOverItemId === item._id;

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
                          if (dragOverItemId === item._id) {
                            setDragOverItemId(null);
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
                        onClick={() => {
                          void handleToggle(item._id, item.isPacked);
                        }}
                        className={`cursor-pointer transition-all relative ${
                          item.isPacked ? "bg-muted/40" : "hover:bg-accent/40"
                        } ${isDragging ? "opacity-40 scale-[0.98] border-primary border-dashed" : ""} ${
                          isDragOver ? "ring-2 ring-primary ring-offset-2 scale-[1.01]" : ""
                        }`}
                      >
                        <CardContent className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 select-none flex-1 min-w-0">
                            {/* Drag Handle */}
                            <div
                              className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors shrink-0"
                              title="Drag to reorder"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Checkbox */}
                            <div
                              className={`checkbox-ui w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0 select-none ${
                                item.isPacked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background"
                              }`}
                            >
                              {item.isPacked && <Check className="w-4 h-4 stroke-[3]" />}
                            </div>

                            {/* Details */}
                            <div className="select-none flex-1 min-w-0">
                              <p
                                className={`item-name font-extrabold text-base sm:text-lg select-none truncate ${
                                  item.isPacked
                                    ? "text-muted-foreground line-through decoration-muted-foreground decoration-2"
                                    : "text-foreground"
                                }`}
                              >
                                {item.emoji && !item.emoji.match(/\p{Emoji}/u) && (
                                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md mr-2 font-mono">
                                    {item.emoji}
                                  </span>
                                )}
                                <span className="select-none">{item.name}</span>
                              </p>
                              <div className="mt-0.5">
                                <Badge variant={item.isPacked ? "default" : "outline"} className="text-[10px] py-0 px-2 font-black">
                                  {item.isPacked ? "Packed" : "Missing"}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Control settings */}
                          <div
                            className="flex items-center gap-1 shrink-0 select-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setManageItem(item);
                                setEditModalName(item.name);
                                setEditModalIconTag(item.emoji ?? "");
                              }}
                              className="text-muted-foreground hover:text-primary rounded-xl w-8 h-8"
                              title="Control Item"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* ─── Add Item Form ───────────────────────────────────────────── */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="uppercase tracking-wider text-xs font-black">
              Add target item to bring:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <form
              onSubmit={(e) => {
                void handleAddItem(e);
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="flex gap-2 sm:flex-1">
                <Input
                  type="text"
                  value={newItemTag}
                  onChange={(e) => setNewItemTag(e.target.value)}
                  placeholder="Tag"
                  className="w-24 text-xs shrink-0"
                  title="Optional item tag or category"
                />
                <Input
                  type="text"
                  value={newCustomItemName}
                  onChange={(e) => setNewCustomItemName(e.target.value)}
                  placeholder="e.g., Umbrella, Wallet, Keys..."
                  className="flex-1"
                />
              </div>
              <Button
                type="submit"
                className="uppercase tracking-wider font-black w-full sm:w-auto"
              >
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* ─── Manage Routine Modal ────────────────────────────────────── */}
      <Dialog open={!!manageRoutine} onOpenChange={(open) => !open && setManageRoutine(null)}>
        {manageRoutine && (
          <DialogContent onClose={() => setManageRoutine(null)}>
            <DialogHeader>
              <DialogTitle>Destination Settings</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Name
                </label>
                <Input
                  type="text"
                  value={editModalName}
                  onChange={(e) => setEditModalName(e.target.value)}
                  placeholder="Destination name..."
                />
              </div>

              {/* Reordering */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Change Order
                </label>
                <div className="flex gap-2">
                  {(() => {
                    const rIndex = routinesList.findIndex((r) => r._id === manageRoutine._id);
                    return (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveRoutineById(manageRoutine._id, -1);
                          }}
                          disabled={rIndex <= 0}
                          className="flex-1"
                        >
                          <ChevronLeft className="w-4 h-4" /> Move Left
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveRoutineById(manageRoutine._id, 1);
                          }}
                          disabled={rIndex === -1 || rIndex >= routinesList.length - 1}
                          className="flex-1"
                        >
                          Move Right <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={async () => {
                    if (!editModalName.trim()) return;
                    try {
                      await updateRoutine({
                        id: manageRoutine._id,
                        name: editModalName.trim(),
                        icon: editModalIconTag || "tag",
                      });
                      const oldName = manageRoutine.name;
                      if (selectedRoutine === oldName) {
                        setSelectedRoutine(editModalName.trim());
                      }
                      setManageRoutine(null);
                    } catch (err) {
                      console.error("Failed to update routine", err);
                    }
                  }}
                  className="w-full uppercase tracking-wider font-black"
                >
                  Save Changes
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm(`Delete "${manageRoutine.name}" and all its items?`)) return;
                      try {
                        await deleteRoutine({ id: manageRoutine._id });
                        setManageRoutine(null);
                      } catch (err) {
                        console.error("Failed to delete routine", err);
                      }
                    }}
                    className="flex-1 text-xs uppercase tracking-wider"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Destination
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setManageRoutine(null)}
                    className="flex-1 text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ─── Manage Item Modal ───────────────────────────────────────── */}
      <Dialog open={!!manageItem} onOpenChange={(open) => !open && setManageItem(null)}>
        {manageItem && (
          <DialogContent onClose={() => setManageItem(null)}>
            <DialogHeader>
              <DialogTitle>Item Settings</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Name
                </label>
                <Input
                  type="text"
                  value={editModalName}
                  onChange={(e) => setEditModalName(e.target.value)}
                  placeholder="Item name..."
                />
              </div>

              {/* Reordering */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Change Order
                </label>
                <div className="flex gap-2">
                  {(() => {
                    const iIndex = items.findIndex((i) => i._id === manageItem._id);
                    return (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveItemById(manageItem._id, -1);
                          }}
                          disabled={iIndex <= 0}
                          className="flex-1"
                        >
                          <ChevronUp className="w-4 h-4" /> Move Up
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMoveItemById(manageItem._id, 1);
                          }}
                          disabled={iIndex === -1 || iIndex >= items.length - 1}
                          className="flex-1"
                        >
                          Move Down <ChevronDown className="w-4 h-4" />
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={async () => {
                    if (!editModalName.trim()) return;
                    try {
                      await editItemMutation({
                        id: manageItem._id,
                        name: editModalName.trim(),
                        emoji: editModalIconTag.trim() || undefined,
                      });
                      setManageItem(null);
                    } catch (err) {
                      console.error("Failed to update item", err);
                    }
                  }}
                  className="w-full uppercase tracking-wider font-black"
                >
                  Save Changes
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm(`Delete "${manageItem.name}"?`)) return;
                      try {
                        await deleteItem({ id: manageItem._id });
                        setManageItem(null);
                      } catch (err) {
                        console.error("Failed to delete item", err);
                      }
                    }}
                    className="flex-1 text-xs uppercase tracking-wider"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Item
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>
      {/* ─── About Project Modal ─────────────────────────────────────── */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent onClose={() => setShowAboutDialog(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> About PocketCheck
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 select-none">
            <p className="text-sm font-bold text-foreground leading-relaxed">
              PocketCheck is a minimal checklist tool designed to make sure you never forget your keys, wallet, phone, or essential items before stepping out for work, gym, or custom routines.
            </p>

            <a
              href="https://github.com/YogaDharma21/pocket-check"
              target="_blank"
              rel="noopener noreferrer"
              className="block pt-2"
            >
              <Button variant="outline" className="w-full gap-2 font-bold text-xs">
                <GitBranch className="w-4 h-4 text-primary" />
                <span>github.com/yogaDharma21/pocket-check</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
      {/* ─── Delete All Items Confirmation Modal ───────────────────── */}
      <Dialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <DialogContent onClose={() => setShowDeleteAllConfirm(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Clear All Items
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm font-bold text-foreground leading-relaxed">
              Are you sure you want to delete all created items in{" "}
              <span className="text-primary font-black">"{selectedRoutine}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={() => void handleDeleteAllCreatedItems()}
                className="flex-1 uppercase font-black tracking-wider text-xs"
              >
                Yes, Delete All
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 uppercase font-black tracking-wider text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
