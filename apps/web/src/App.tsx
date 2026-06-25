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

export default function App() {
  return (
    <div className="bg-[#131f24] text-white antialiased min-h-screen flex flex-col justify-between selection:bg-[#58cc02] selection:text-white">
      {/* Loading State */}
      <AuthLoading>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#131f24]">
          <span className="text-6xl animate-bounce">🦉</span>
          <p className="font-extrabold text-xl tracking-wider text-[#afbbbf] animate-pulse">
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
        <span className="text-8xl block hover:scale-110 transition-transform cursor-pointer">🦉</span>
        <h1 className="text-4xl font-black tracking-wide text-white">
          POCKET<span className="text-[#58cc02]">CHECK</span>
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#58cc02] font-black">
          Duo Edition
        </p>
        <p className="text-[#afbbbf] font-bold text-base leading-relaxed">
          Double-check your pockets before you step out! Create packing lists for work, the gym, or your custom routines.
        </p>
      </div>

      <div className="w-full space-y-4 pt-4">
        <SignInButton mode="modal">
          <button className="w-full py-4 rounded-2xl bg-[#58cc02] border-b-6 border-[#46a302] hover:brightness-110 text-white font-black text-lg uppercase tracking-wider transition-all active:translate-y-[2px] active:border-b-4 cursor-pointer text-center block">
            Log In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="w-full py-4 rounded-2xl bg-[#1cb0f6] border-b-6 border-[#1899d6] hover:brightness-110 text-white font-black text-lg uppercase tracking-wider transition-all active:translate-y-[2px] active:border-b-4 cursor-pointer text-center block">
            Create Account
          </button>
        </SignUpButton>
      </div>

      <p className="text-xs text-[#afbbbf] font-bold text-center pt-8">
        🦉 "Remember to pack your keys, or I will find you."
      </p>
    </div>
  );
}

function Dashboard() {
  const [selectedRoutine, setSelectedRoutine] = useState("Work");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customRoutineName, setCustomRoutineName] = useState("");
  const [customRoutineIcon, setCustomRoutineIcon] = useState("📍");
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("");

  // Item editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemEmoji, setEditItemEmoji] = useState("");

  // Routine editing state
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editRoutineName, setEditRoutineName] = useState("");
  const [editRoutineIcon, setEditRoutineIcon] = useState("");

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
  const reorderRoutine = useMutation(api.pocketcheck.reorderRoutine);

  const items = useQuery(api.pocketcheck.listItems, { routine: selectedRoutine }) ?? [];
  const customRoutines = useQuery(api.pocketcheck.listRoutines) ?? [];

  // Seed default routines + items on first login
  useEffect(() => {
    void ensureInitialized();
  }, [ensureInitialized]);

  // All routines come from the database — no hardcoded defaults
  const routinesList = customRoutines;

  // Auto-select first available routine when the current one no longer exists
  useEffect(() => {
    if (routinesList.length > 0 && !routinesList.find((r) => r.name === selectedRoutine)) {
      setSelectedRoutine(routinesList[0].name);
    }
  }, [routinesList, selectedRoutine]);

  // Calculate progress metrics
  const totalItems = items.length;
  const packedItems = items.filter((i) => i.isPacked).length;
  const percentage = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  // Owl headline
  let headline = "Let's double-check before you pack!";
  if (totalItems === 0) {
    headline = "Your pocket list is empty. Add items below!";
  } else if (packedItems === totalItems) {
    headline = "Excellent! You are 100% prepared to leave! 🦉✨";
  } else if (percentage >= 50) {
    headline = "Looking good! Keep grabbing those items!";
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleToggle = async (itemId: Id<"items">, currentPacked: boolean) => {
    try {
      await toggleItem({ id: itemId, isPacked: !currentPacked });
    } catch (err) {
      console.error("Failed to toggle item", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, itemId: Id<"items">) => {
    e.stopPropagation();
    try {
      await deleteItem({ id: itemId });
      if (editingItemId === itemId) setEditingItemId(null);
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const handleReset = async () => {
    try {
      await resetItems({ routine: selectedRoutine });
    } catch (err) {
      console.error("Failed to reset list", err);
    }
  };

  const handleMoveItem = async (e: React.MouseEvent, index: number, direction: -1 | 1) => {
    e.stopPropagation();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    try {
      // Build reordered ID list and write sequential orders in one shot.
      // This also normalises items that were created before the order field existed.
      const ids = items.map((i) => i._id);
      const [moved] = ids.splice(index, 1);
      ids.splice(targetIndex, 0, moved);
      await reorderItems({ ids });
    } catch (err) {
      console.error("Failed to reorder item", err);
    }
  };

  const handleMoveRoutine = async (e: React.MouseEvent, index: number, direction: -1 | 1) => {
    e.stopPropagation();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= routinesList.length) return;
    try {
      await reorderRoutine({ idA: routinesList[index]._id, idB: routinesList[targetIndex]._id });
    } catch (err) {
      console.error("Failed to reorder routine", err);
    }
  };

  const handleCreateRoutine = async () => {
    if (!customRoutineName.trim()) return;
    try {
      await addRoutine({ name: customRoutineName.trim(), icon: customRoutineIcon || "📍" });
      setSelectedRoutine(customRoutineName.trim());
      setCustomRoutineName("");
      setCustomRoutineIcon("📍");
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
        emoji: newItemEmoji.trim() || undefined,
      });
      setNewCustomItemName("");
      setNewItemEmoji("");
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  const startEditItem = (item: (typeof items)[0]) => {
    setEditingItemId(item._id);
    setEditItemName(item.name);
    setEditItemEmoji(item.emoji ?? "");
  };

  const handleSaveItem = async () => {
    if (!editItemName.trim() || !editingItemId) return;
    try {
      await editItemMutation({
        id: editingItemId as Id<"items">,
        name: editItemName.trim(),
        emoji: editItemEmoji.trim() || undefined,
      });
      setEditingItemId(null);
    } catch (err) {
      console.error("Failed to save item", err);
    }
  };

  const startEditRoutine = (routine: (typeof customRoutines)[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCustomInput(false);
    setEditingRoutineId(routine._id);
    setEditRoutineName(routine.name);
    setEditRoutineIcon(routine.icon);
  };

  const handleSaveRoutine = async () => {
    if (!editRoutineName.trim() || !editingRoutineId) return;
    const oldName = customRoutines.find((r) => r._id === editingRoutineId)?.name;
    try {
      await updateRoutine({
        id: editingRoutineId as Id<"routines">,
        name: editRoutineName.trim(),
        icon: editRoutineIcon || "📍",
      });
      if (oldName && selectedRoutine === oldName) {
        setSelectedRoutine(editRoutineName.trim());
      }
      setEditingRoutineId(null);
    } catch (err) {
      console.error("Failed to update routine", err);
    }
  };

  const handleDeleteRoutine = async (routine: (typeof customRoutines)[0], e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${routine.name}" and all its items?`)) return;
    try {
      await deleteRoutine({ id: routine._id });
      // selectedRoutine will be auto-corrected by the useEffect above
      if (editingRoutineId === routine._id) setEditingRoutineId(null);
    } catch (err) {
      console.error("Failed to delete routine", err);
    }
  };

  return (
    <>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-[#131f24] border-b-2 border-[#37464f] sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Changed from ✨ to 🎒 — much more visible on dark bg */}
            <div className="bg-[#58cc02] text-white p-2 rounded-xl border-b-4 border-[#46a302]">
              <span className="text-xl block">🎒</span>
            </div>
            <h1 className="text-2xl font-black tracking-wide">
              POCKET<span className="text-[#58cc02]">CHECK</span>
            </h1>
          </div>
          {/* Fire/streak badge removed — just the user avatar */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="w-full max-w-xl mx-auto p-4 flex-1 space-y-6 pb-24 md:py-8">

        {/* ─── Owl progress block ──────────────────────────────────────── */}
        <div className="bg-[#202f36] border-2 border-[#37464f] border-b-6 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="hidden sm:block text-4xl mt-1">🦉</div>
            <div className="flex-1 space-y-3">
              <h2 id="status-headline" className="text-xl font-extrabold tracking-wide text-white">
                {headline}
              </h2>
              <div className="w-full bg-[#37464f] rounded-full h-4 relative">
                <div
                  id="progress-bar"
                  className="bg-[#58cc02] h-4 rounded-full transition-all duration-300 border-b-4 border-[#46a302]"
                  style={{ width: `${percentage}%` }}
                >
                  <div className="w-full h-1 bg-white/20 rounded-full mt-0.5 px-1"></div>
                </div>
              </div>
              <p id="progress-text" className="text-sm font-bold text-[#afbbbf]">
                {packedItems} of {totalItems} items safely pocketed
              </p>
            </div>
          </div>
        </div>

        {/* ─── Routine Switcher ────────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-[#afbbbf] uppercase tracking-wider">
            Where are we heading today?
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {routinesList.map((routine, rIndex) => {
              const isActive = routine.name === selectedRoutine;

              return (
                <div key={routine.name} className="relative">
                  <button
                    onClick={() => {
                      setSelectedRoutine(routine.name);
                      setShowCustomInput(false);
                      setEditingRoutineId(null);
                    }}
                    className={`routine-btn w-full flex flex-col items-center gap-1.5 p-3.5 pt-5 rounded-2xl bg-[#202f36] border-2 text-sm font-black transition-all cursor-pointer ${
                      isActive
                        ? "border-b-4 border-[#58cc02] text-[#58cc02] translate-y-[2px]"
                        : "border-b-6 border-[#37464f] hover:bg-[#283840] text-white active:translate-y-[2px] active:border-b-4"
                    }`}
                  >
                    <span className="text-xl block">{routine.icon}</span>
                    <span className="truncate max-w-full">{routine.name}</span>
                  </button>

                  {/* Top-left: move up/down */}
                  <div className="absolute top-1 left-1 flex gap-0.5">
                    <button
                      onClick={(e) => { void handleMoveRoutine(e, rIndex, -1); }}
                      disabled={rIndex === 0}
                      className="w-5 h-5 flex items-center justify-center rounded bg-[#37464f] hover:bg-[#58cc02] disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] transition-colors cursor-pointer"
                      title="Move left"
                    >
                      ◀
                    </button>
                    <button
                      onClick={(e) => { void handleMoveRoutine(e, rIndex, 1); }}
                      disabled={rIndex === routinesList.length - 1}
                      className="w-5 h-5 flex items-center justify-center rounded bg-[#37464f] hover:bg-[#58cc02] disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] transition-colors cursor-pointer"
                      title="Move right"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Top-right: edit/delete */}
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    <button
                      onClick={(e) => startEditRoutine(routine, e)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-[#37464f] hover:bg-[#1cb0f6] text-white text-[10px] transition-colors cursor-pointer"
                      title="Edit destination"
                    >
                      ✏
                    </button>
                    <button
                      onClick={(e) => { void handleDeleteRoutine(routine, e); }}
                      className="w-5 h-5 flex items-center justify-center rounded bg-[#37464f] hover:bg-[#ff4b4b] text-white text-[10px] transition-colors cursor-pointer"
                      title="Delete destination"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add custom destination button */}
            <button
              onClick={() => {
                setShowCustomInput(!showCustomInput);
                setEditingRoutineId(null);
              }}
              className={`routine-btn flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-[#202f36] border-2 text-sm font-black transition-all cursor-pointer ${
                showCustomInput
                  ? "border-b-4 border-[#58cc02] text-[#58cc02] translate-y-[2px]"
                  : "border-b-6 border-[#37464f] hover:bg-[#283840] text-white active:translate-y-[2px] active:border-b-4"
              }`}
            >
              <span className="text-xl block">✏️</span>
              <span>Custom</span>
            </button>
          </div>

          {/* Edit routine inline form */}
          {editingRoutineId && (
            <div className="animate-fadeIn mt-2">
              <div className="flex gap-2 bg-[#202f36] border-2 border-[#1cb0f6] rounded-xl p-2 items-center">
                <input
                  type="text"
                  value={editRoutineIcon}
                  onChange={(e) => setEditRoutineIcon(e.target.value)}
                  placeholder="📍"
                  maxLength={2}
                  className="bg-[#131f24] border-2 border-[#37464f] rounded-lg text-center text-xl w-12 h-10 shrink-0 focus:outline-none focus:border-[#1cb0f6] transition-colors"
                  title="Destination emoji"
                />
                <input
                  type="text"
                  value={editRoutineName}
                  onChange={(e) => setEditRoutineName(e.target.value)}
                  placeholder="Destination name..."
                  className="bg-transparent text-white font-bold text-sm px-2 flex-1 focus:outline-none placeholder-[#afbbbf]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSaveRoutine();
                    if (e.key === "Escape") setEditingRoutineId(null);
                  }}
                  autoFocus
                />
                <button
                  onClick={() => { void handleSaveRoutine(); }}
                  className="bg-[#58cc02] border-b-4 border-[#46a302] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider active:translate-y-[2px] active:border-b-2 cursor-pointer shrink-0"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingRoutineId(null)}
                  className="bg-[#37464f] hover:bg-[#455a64] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* New custom destination form */}
          {showCustomInput && (
            <div className="animate-fadeIn mt-2">
              <div className="flex gap-2 bg-[#202f36] border-2 border-[#37464f] rounded-xl p-2 items-center">
                <input
                  type="text"
                  value={customRoutineIcon}
                  onChange={(e) => setCustomRoutineIcon(e.target.value)}
                  placeholder="📍"
                  maxLength={2}
                  className="bg-[#131f24] border-2 border-[#37464f] rounded-lg text-center text-xl w-12 h-10 shrink-0 focus:outline-none focus:border-[#1cb0f6] transition-colors"
                  title="Destination emoji"
                />
                <input
                  type="text"
                  value={customRoutineName}
                  onChange={(e) => setCustomRoutineName(e.target.value)}
                  placeholder="Name your destination..."
                  className="bg-transparent text-white font-bold text-sm px-2 flex-1 focus:outline-none placeholder-[#afbbbf]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreateRoutine();
                  }}
                />
                <button
                  onClick={() => { void handleCreateRoutine(); }}
                  className="bg-[#1cb0f6] border-b-4 border-[#1899d6] text-white font-extrabold text-xs px-4 py-1.5 rounded-xl uppercase tracking-wider active:translate-y-[2px] active:border-b-2 cursor-pointer shrink-0"
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
            <h3 className="text-sm font-black text-[#afbbbf] uppercase tracking-wider">
              Should Bring vs. Have Brought
            </h3>
            <button
              onClick={() => { void handleReset(); }}
              className="text-sm text-[#1cb0f6] font-black uppercase tracking-wider hover:brightness-110 flex items-center gap-1 cursor-pointer"
            >
              <span className="text-xs block">🔄</span> Reset
            </button>
          </div>

          <div className="space-y-3" id="checklist-container">
            {items.map((item, iIndex) => {
              const isEditing = editingItemId === item._id;
              return (
                <div key={item._id}>
                  {isEditing ? (
                    /* ── Edit mode ── */
                    <div className="flex gap-2 bg-[#202f36] border-2 border-[#1cb0f6] border-b-4 rounded-2xl p-3 items-center">
                      <input
                        type="text"
                        value={editItemEmoji}
                        onChange={(e) => setEditItemEmoji(e.target.value)}
                        placeholder="😀"
                        maxLength={2}
                        className="bg-[#131f24] border-2 border-[#37464f] rounded-lg text-center text-xl w-12 h-10 shrink-0 focus:outline-none focus:border-[#1cb0f6] transition-colors"
                        title="Item emoji (optional)"
                      />
                      <input
                        type="text"
                        value={editItemName}
                        onChange={(e) => setEditItemName(e.target.value)}
                        className="flex-1 bg-[#131f24] border-2 border-[#37464f] px-3 py-2 rounded-xl font-bold text-sm text-white focus:outline-none focus:border-[#1cb0f6] transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleSaveItem();
                          if (e.key === "Escape") setEditingItemId(null);
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => { void handleSaveItem(); }}
                        className="bg-[#58cc02] border-b-4 border-[#46a302] text-white font-extrabold text-xs px-3 py-2 rounded-xl uppercase shrink-0 cursor-pointer active:translate-y-[2px] active:border-b-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="bg-[#37464f] hover:bg-[#455a64] text-white font-extrabold text-xs px-3 py-2 rounded-xl shrink-0 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    /* ── Normal view mode ── */
                    <div
                      onClick={() => { void handleToggle(item._id, item.isPacked); }}
                      className={`item-row flex items-center justify-between p-4 border-2 border-b-6 rounded-2xl cursor-pointer transition-all ${
                        item.isPacked
                          ? "is-packed bg-[#243b14] border-[#46a302]"
                          : "bg-[#202f36] border-[#37464f] hover:bg-[#283840]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`checkbox-ui w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${
                            item.isPacked
                              ? "border-[#46a302] bg-[#58cc02]"
                              : "border-[#37464f] border-b-4 bg-[#131f24]"
                          }`}
                        >
                          <span className={`text-xs ${item.isPacked ? "block" : "hidden"}`}>✅</span>
                        </div>
                        <div>
                          <p
                            className={`item-name font-extrabold text-lg text-white ${
                              item.isPacked ? "text-[#afbbbf] line-through decoration-[#46a302] decoration-2" : ""
                            }`}
                          >
                            {item.emoji && (
                              <span className="not-italic mr-1.5">{item.emoji}</span>
                            )}
                            {item.name}
                          </p>
                          <p
                            className={`item-status text-xs font-black uppercase tracking-wider ${
                              item.isPacked ? "text-[#58cc02]" : "text-[#afbbbf]"
                            }`}
                          >
                            {item.isPacked ? "Packed" : "Missing"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move up/down */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={(e) => { void handleMoveItem(e, iIndex, -1); }}
                            disabled={iIndex === 0}
                            className="w-6 h-5 flex items-center justify-center rounded bg-[#37464f] hover:bg-[#58cc02] disabled:opacity-30 disabled:cursor-not-allowed text-white text-[9px] transition-colors cursor-pointer"
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={(e) => { void handleMoveItem(e, iIndex, 1); }}
                            disabled={iIndex === items.length - 1}
                            className="w-6 h-5 flex items-center justify-center rounded bg-[#37464f] hover:bg-[#58cc02] disabled:opacity-30 disabled:cursor-not-allowed text-white text-[9px] transition-colors cursor-pointer"
                            title="Move down"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditItem(item); }}
                          className="text-[#afbbbf] hover:text-[#1cb0f6] p-2 rounded-xl transition-colors hover:bg-[#131f24] cursor-pointer"
                          title="Edit Item"
                        >
                          <span className="text-base block">✏️</span>
                        </button>
                        <button
                          onClick={(e) => { void handleDelete(e, item._id); }}
                          className="text-[#afbbbf] hover:text-[#ff4b4b] p-2 rounded-xl transition-colors hover:bg-[#131f24] cursor-pointer"
                          title="Delete Item"
                        >
                          <span className="text-xl block">🗑️</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Add Item form ───────────────────────────────────────────── */}
        <div className="bg-[#202f36] border-2 border-[#37464f] border-b-6 rounded-2xl p-4">
          <h3 className="text-xs font-black text-[#afbbbf] uppercase tracking-wider mb-3">
            Add target item to bring:
          </h3>
          <form onSubmit={(e) => { void handleAddItem(e); }} className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 sm:flex-1">
              <input
                type="text"
                value={newItemEmoji}
                onChange={(e) => setNewItemEmoji(e.target.value)}
                placeholder="😀"
                maxLength={2}
                className="bg-[#131f24] border-2 border-[#37464f] rounded-xl text-center text-xl w-14 shrink-0 focus:outline-none focus:border-[#1cb0f6] transition-colors"
                title="Optional emoji"
              />
              <input
                type="text"
                value={newCustomItemName}
                onChange={(e) => setNewCustomItemName(e.target.value)}
                placeholder="e.g., Umbrella, AirPods..."
                className="flex-1 bg-[#131f24] border-2 border-[#37464f] px-4 py-3 rounded-xl font-bold text-sm text-white focus:outline-none focus:border-[#1cb0f6] placeholder-[#afbbbf] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-[#1cb0f6] border-b-6 border-[#1899d6] hover:brightness-110 text-white py-3 sm:py-0 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all active:translate-y-[2px] active:border-b-4 shrink-0 cursor-pointer w-full sm:w-auto"
            >
              Add
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
