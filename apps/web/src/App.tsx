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
  X,
  Tag,
} from "lucide-react";

export default function App() {
  return (
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
          <button className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg uppercase tracking-wider transition-all cursor-pointer text-center block shadow-sm">
            Log In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="w-full py-4 rounded-2xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-black text-lg uppercase tracking-wider transition-all cursor-pointer text-center block border border-border">
            Create Account
          </button>
        </SignUpButton>
      </div>

      <p className="text-xs text-muted-foreground font-bold text-center pt-8">
        "Double-check your pockets before you step out."
      </p>
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

  // Ensure dark mode is default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

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
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="w-full max-w-xl mx-auto p-4 flex-1 space-y-6 pb-24 md:py-8">
        {/* ─── Progress Status Block ───────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-start gap-4 select-none">
            <ShieldCheck className="w-10 h-10 text-primary shrink-0 hidden sm:block mt-1" />
            <div className="flex-1 space-y-3">
              <h2 id="status-headline" className="text-xl font-extrabold tracking-wide text-card-foreground">
                {headline}
              </h2>
              <div className="w-full bg-muted rounded-full h-4 relative overflow-hidden">
                <div
                  id="progress-bar"
                  className="bg-primary h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <p id="progress-text" className="text-sm font-bold text-muted-foreground">
                {packedItems} of {totalItems} items safely pocketed
              </p>
            </div>
          </div>
        </div>

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
                  <button
                    onClick={() => {
                      setSelectedRoutine(routine.name);
                      setShowCustomInput(false);
                    }}
                    className={`routine-btn w-full flex flex-col items-center gap-2 p-3.5 pt-5 rounded-2xl border text-sm font-black transition-all cursor-pointer select-none ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <span className="block select-none">{renderRoutineIcon(routine.name)}</span>
                    <span className="truncate max-w-full select-none">{routine.name}</span>
                  </button>

                  {/* Settings gear button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setManageRoutine(routine);
                      setEditModalName(routine.name);
                      setEditModalIconTag(routine.icon);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground text-xs transition-colors cursor-pointer z-10"
                    title="Control"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Add custom destination button */}
            <button
              onClick={() => {
                setShowCustomInput(!showCustomInput);
              }}
              className={`routine-btn flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-sm font-black transition-all cursor-pointer ${
                showCustomInput
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>Custom</span>
            </button>
          </div>

          {/* New custom destination form */}
          {showCustomInput && (
            <div className="animate-fadeIn mt-2">
              <div className="flex gap-2 bg-card border border-border rounded-xl p-2 items-center shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                  <Tag className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={customRoutineName}
                  onChange={(e) => setCustomRoutineName(e.target.value)}
                  placeholder="Name your destination..."
                  className="bg-transparent text-foreground font-bold text-sm px-2 flex-1 focus:outline-none placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreateRoutine();
                  }}
                />
                <button
                  onClick={() => {
                    void handleCreateRoutine();
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs px-4 py-2 rounded-xl uppercase tracking-wider cursor-pointer shrink-0"
                >
                  Set
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Checklist ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider">
              Should Bring vs. Have Brought
            </h3>
            <button
              onClick={() => {
                void handleReset();
              }}
              className="text-sm text-primary font-black uppercase tracking-wider hover:opacity-80 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="space-y-3" id="checklist-container">
            {items.map((item) => {
              return (
                <div key={item._id}>
                  <div
                    onClick={() => {
                      void handleToggle(item._id, item.isPacked);
                    }}
                    className={`item-row flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all select-none shadow-sm ${
                      item.isPacked
                        ? "bg-muted/50 border-border"
                        : "bg-card border-border hover:bg-accent/40"
                    }`}
                  >
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
                        <p
                          className={`item-status text-xs font-black uppercase tracking-wider select-none ${
                            item.isPacked ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {item.isPacked ? "Packed" : "Missing"}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0 select-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setManageItem(item);
                          setEditModalName(item.name);
                          setEditModalIconTag(item.emoji ?? "");
                        }}
                        className="text-muted-foreground hover:text-primary w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-all cursor-pointer"
                        title="Control Item"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Add Item Form ───────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">
            Add target item to bring:
          </h3>
          <form
            onSubmit={(e) => {
              void handleAddItem(e);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="flex gap-2 sm:flex-1">
              <input
                type="text"
                value={newItemTag}
                onChange={(e) => setNewItemTag(e.target.value)}
                placeholder="Category/Tag"
                className="bg-background border border-input rounded-xl px-3 text-xs font-bold text-foreground w-28 shrink-0 focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                title="Optional item tag or category"
              />
              <input
                type="text"
                value={newCustomItemName}
                onChange={(e) => setNewCustomItemName(e.target.value)}
                placeholder="e.g., Umbrella, Wallet, Keys..."
                className="flex-1 bg-background border border-input px-4 py-3 rounded-xl font-bold text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 sm:py-0 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all shrink-0 cursor-pointer w-full sm:w-auto shadow-sm"
            >
              Add
            </button>
          </form>
        </div>
      </main>

      {/* ─── Manage Routine Modal ────────────────────────────────────── */}
      {manageRoutine && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100] animate-fadeIn p-4">
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scaleIn select-none">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black select-none">Destination Settings</h2>
              <button
                onClick={() => setManageRoutine(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider select-none">
                  Name
                </label>
                <input
                  type="text"
                  value={editModalName}
                  onChange={(e) => setEditModalName(e.target.value)}
                  className="bg-background border border-input rounded-xl px-4 h-12 font-bold text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  placeholder="Destination name..."
                />
              </div>

              {/* Reordering */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider select-none">
                  Change Order
                </label>
                <div className="flex gap-2">
                  {(() => {
                    const rIndex = routinesList.findIndex((r) => r._id === manageRoutine._id);
                    return (
                      <>
                        <button
                          onClick={() => {
                            void handleMoveRoutineById(manageRoutine._id, -1);
                          }}
                          disabled={rIndex <= 0}
                          className="flex-1 py-3 rounded-xl bg-muted hover:bg-accent disabled:opacity-40 text-foreground font-extrabold text-sm transition-colors cursor-pointer flex justify-center items-center gap-1.5 border border-border"
                        >
                          <ChevronLeft className="w-4 h-4" /> Move Left
                        </button>
                        <button
                          onClick={() => {
                            void handleMoveRoutineById(manageRoutine._id, 1);
                          }}
                          disabled={rIndex === -1 || rIndex >= routinesList.length - 1}
                          className="flex-1 py-3 rounded-xl bg-muted hover:bg-accent disabled:opacity-40 text-foreground font-extrabold text-sm transition-colors cursor-pointer flex justify-center items-center gap-1.5 border border-border"
                        >
                          Move Right <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Save & Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <button
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
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${manageRoutine.name}" and all its items?`)) return;
                      try {
                        await deleteRoutine({ id: manageRoutine._id });
                        setManageRoutine(null);
                      } catch (err) {
                        console.error("Failed to delete routine", err);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Destination
                  </button>
                  <button
                    onClick={() => setManageRoutine(null)}
                    className="flex-1 py-3 rounded-xl bg-muted hover:bg-accent text-muted-foreground font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Manage Item Modal ───────────────────────────────────────── */}
      {manageItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100] animate-fadeIn p-4">
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scaleIn select-none">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black select-none">Item Settings</h2>
              <button
                onClick={() => setManageItem(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider select-none">
                  Name
                </label>
                <input
                  type="text"
                  value={editModalName}
                  onChange={(e) => setEditModalName(e.target.value)}
                  className="bg-background border border-input rounded-xl px-4 h-12 font-bold text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  placeholder="Item name..."
                />
              </div>

              {/* Reordering */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider select-none">
                  Change Order
                </label>
                <div className="flex gap-2">
                  {(() => {
                    const iIndex = items.findIndex((i) => i._id === manageItem._id);
                    return (
                      <>
                        <button
                          onClick={() => {
                            void handleMoveItemById(manageItem._id, -1);
                          }}
                          disabled={iIndex <= 0}
                          className="flex-1 py-3 rounded-xl bg-muted hover:bg-accent disabled:opacity-40 text-foreground font-extrabold text-sm transition-colors cursor-pointer flex justify-center items-center gap-1.5 border border-border"
                        >
                          <ChevronUp className="w-4 h-4" /> Move Up
                        </button>
                        <button
                          onClick={() => {
                            void handleMoveItemById(manageItem._id, 1);
                          }}
                          disabled={iIndex === -1 || iIndex >= items.length - 1}
                          className="flex-1 py-3 rounded-xl bg-muted hover:bg-accent disabled:opacity-40 text-foreground font-extrabold text-sm transition-colors cursor-pointer flex justify-center items-center gap-1.5 border border-border"
                        >
                          Move Down <ChevronDown className="w-4 h-4" />
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Save & Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <button
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
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${manageItem.name}"?`)) return;
                      try {
                        await deleteItem({ id: manageItem._id });
                        setManageItem(null);
                      } catch (err) {
                        console.error("Failed to delete item", err);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Item
                  </button>
                  <button
                    onClick={() => setManageItem(null)}
                    className="flex-1 py-3 rounded-xl bg-muted hover:bg-accent text-muted-foreground font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
