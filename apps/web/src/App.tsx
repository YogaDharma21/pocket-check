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

      <p className="text-xs text-muted-foreground font-bold text-center pt-4">
        "Double-check your pockets before you step out."
      </p>

      <AboutCard />
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
  const reorderItems = useMutation(api.pocketcheck.reorderItems);
  const reorderRoutines = useMutation(api.pocketcheck.reorderRoutines);

  const items = useQuery(api.pocketcheck.listItems, { routine: selectedRoutine }) ?? [];
  const customRoutines = useQuery(api.pocketcheck.listRoutines) ?? [];

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

        {/* ─── Checklist ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider">
              Should Bring vs. Have Brought
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void handleReset();
              }}
              className="text-primary hover:text-primary/80 font-black uppercase tracking-wider gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>

          <div className="space-y-3" id="checklist-container">
            {items.map((item) => {
              return (
                <Card
                  key={item._id}
                  onClick={() => {
                    void handleToggle(item._id, item.isPacked);
                  }}
                  className={`cursor-pointer transition-all ${
                    item.isPacked ? "bg-muted/40" : "hover:bg-accent/40"
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5 select-none">
                      <div
                        className={`checkbox-ui w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0 select-none ${
                          item.isPacked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {item.isPacked && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <div className="select-none">
                        <p
                          className={`item-name font-extrabold text-lg select-none ${
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
                        <div className="mt-1">
                          <Badge variant={item.isPacked ? "default" : "outline"}>
                            {item.isPacked ? "Packed" : "Missing"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0 select-none"
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
                        className="text-muted-foreground hover:text-primary rounded-xl"
                        title="Control Item"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

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

        {/* ─── About Section ───────────────────────────────────────────── */}
        <AboutCard />
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
                  <Button
                    variant="outline"
                    onClick={() => setManageItem(null)}
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
    </>
  );
}

function AboutCard() {
  return (
    <Card className="mt-8 border-dashed">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 font-black text-sm text-foreground">
            <Info className="w-4 h-4 text-primary" />
            <span>About PocketCheck</span>
          </div>
          <p className="text-xs font-bold text-muted-foreground max-w-sm leading-relaxed">
            PocketCheck is a minimal checklist tool to help you double-check your essential items before stepping out for work, gym, or custom routines.
          </p>
        </div>
        <a
          href="https://github.com/YogaDharma21/pocket-check"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button variant="outline" size="sm" className="gap-2 font-bold text-xs">
            <GitBranch className="w-4 h-4 text-primary" />
            <span>github.com/yogaDharma21/pocket-check</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
