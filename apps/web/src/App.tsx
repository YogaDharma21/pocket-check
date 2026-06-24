import { useEffect, useState } from "react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
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
  const [newCustomItemName, setNewCustomItemName] = useState("");

  // Convex mutations & queries
  const ensureInitialized = useMutation(api.pocketcheck.ensureInitialized);
  const addRoutine = useMutation(api.pocketcheck.addRoutine);
  const addItem = useMutation(api.pocketcheck.addItem);
  const toggleItem = useMutation(api.pocketcheck.toggleItem);
  const deleteItem = useMutation(api.pocketcheck.deleteItem);
  const resetItems = useMutation(api.pocketcheck.resetItems);

  const items = useQuery(api.pocketcheck.listItems, { routine: selectedRoutine }) ?? [];
  const customRoutines = useQuery(api.pocketcheck.listRoutines) ?? [];

  // Seed default lists if they are empty
  useEffect(() => {
    void ensureInitialized();
  }, [ensureInitialized]);

  // Combine standard and custom routines
  const defaultRoutines = [
    { name: "Work", icon: "💼" },
    { name: "Gym", icon: "🏋️" },
  ];
  const routinesList = [...defaultRoutines, ...customRoutines];

  // Calculate progress metrics
  const totalItems = items.length;
  const packedItems = items.filter((i) => i.isPacked).length;
  const percentage = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  // Compute owl headline message
  let headline = "Let's double-check before you pack!";
  let streakText = "0% Ready";

  if (totalItems === 0) {
    headline = "Your pocket list is empty. Add items below!";
    streakText = "0% Ready";
  } else if (packedItems === totalItems) {
    headline = "Excellent! You are 100% prepared to leave! 🦉✨";
    streakText = "100% Ready";
  } else if (percentage >= 50) {
    headline = "Looking good! Keep grabbing those items!";
    streakText = `${Math.round(percentage)}% Ready`;
  } else {
    streakText = `${Math.round(percentage)}% Ready`;
  }

  // Handle toggling checkbox status
  const handleToggle = async (itemId: any, currentPacked: boolean) => {
    try {
      await toggleItem({ id: itemId, isPacked: !currentPacked });
    } catch (err) {
      console.error("Failed to toggle item", err);
    }
  };

  // Handle deleting item
  const handleDelete = async (e: React.MouseEvent, itemId: any) => {
    e.stopPropagation();
    try {
      await deleteItem({ id: itemId });
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  // Handle resetting active checklist
  const handleReset = async () => {
    try {
      await resetItems({ routine: selectedRoutine });
    } catch (err) {
      console.error("Failed to reset list", err);
    }
  };

  // Handle custom routine creation
  const handleCreateRoutine = async () => {
    if (!customRoutineName.trim()) return;
    const emojis = ["🏖️", "🚀", "📚", "🎬", "🍔", "🛍️", "🚶", "🚲", "🎨", "🎮"];
    const randomIcon = emojis[Math.floor(Math.random() * emojis.length)];

    try {
      await addRoutine({ name: customRoutineName.trim(), icon: randomIcon });
      setSelectedRoutine(customRoutineName.trim());
      setCustomRoutineName("");
      setShowCustomInput(false);
    } catch (err) {
      console.error("Failed to create routine", err);
    }
  };

  // Handle appending new checklist item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomItemName.trim()) return;

    try {
      await addItem({ routine: selectedRoutine, name: newCustomItemName.trim() });
      setNewCustomItemName("");
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  return (
    <>
      <header className="bg-[#131f24] border-b-2 border-[#37464f] sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#58cc02] text-white p-2 rounded-xl border-b-4 border-[#46a302]">
              <span className="text-xl block">✨</span>
            </div>
            <h1 className="text-2xl font-black tracking-wide">
              POCKET<span className="text-[#58cc02]">CHECK</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#202f36] border-2 border-[#37464f] border-b-4 px-3 py-1.5 rounded-xl font-extrabold text-[#ff9600]">
              <span className="text-base block">🔥</span>
              <span id="streak-count">{streakText}</span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="w-full max-w-xl mx-auto p-4 flex-1 space-y-6 pb-24 md:py-8">
        {/* Owl progress block */}
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

        {/* Routine Switcher Panel */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-[#afbbbf] uppercase tracking-wider">
            Where are we heading today?
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {routinesList.map((routine) => {
              const isActive = routine.name === selectedRoutine;
              return (
                <button
                  key={routine.name}
                  onClick={() => {
                    setSelectedRoutine(routine.name);
                    setShowCustomInput(false);
                  }}
                  className={`routine-btn flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-[#202f36] border-2 text-sm font-black transition-all cursor-pointer ${
                    isActive
                      ? "border-b-4 border-[#58cc02] text-[#58cc02] translate-y-[2px]"
                      : "border-b-6 border-[#37464f] hover:bg-[#283840] text-white active:translate-y-[2px] active:border-b-4"
                  }`}
                >
                  <span className="text-xl block">{routine.icon}</span>
                  <span className="truncate max-w-full">{routine.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
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

          {/* Custom destination textbox */}
          {showCustomInput && (
            <div className="animate-fadeIn mt-2">
              <div className="flex gap-2 bg-[#202f36] border-2 border-[#37464f] rounded-xl p-2">
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
                  className="bg-[#1cb0f6] border-b-4 border-[#1899d6] text-white font-extrabold text-xs px-4 py-1.5 rounded-xl uppercase tracking-wider active:translate-y-[2px] active:border-b-2 cursor-pointer"
                >
                  Set
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Checklist Container */}
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
            {items.map((item) => {
              return (
                <div
                  key={item._id}
                  onClick={() => { void handleToggle(item._id, item.isPacked); }}
                  className={`item-row flex items-center justify-between p-4 border-2 border-b-6 rounded-2xl cursor-pointer transition-all ${
                    item.isPacked
                      ? "is-packed bg-[#243b14] border-[#46a302]"
                      : "bg-[#202f36] border-[#37464f] hover:bg-[#283840]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`checkbox-ui w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                        item.isPacked
                          ? "border-[#46a302] bg-[#58cc02]"
                          : "border-[#37464f] border-b-4 bg-[#131f24]"
                      }`}
                    >
                      <span className={`text-xs ${item.isPacked ? "block" : "hidden"}`}>
                        ✅
                      </span>
                    </div>
                    <div>
                      <p
                        className={`item-name font-extrabold text-lg text-white ${
                          item.isPacked ? "text-[#afbbbf] line-through decoration-[#46a302] decoration-2" : ""
                        }`}
                      >
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
                  <button
                    onClick={(e) => { void handleDelete(e, item._id); }}
                    className="text-[#afbbbf] hover:text-[#ff4b4b] p-2 rounded-xl transition-colors hover:bg-[#131f24] cursor-pointer"
                    title="Delete Item"
                  >
                    <span className="text-xl block">🗑️</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Item form */}
        <div className="bg-[#202f36] border-2 border-[#37464f] border-b-6 rounded-2xl p-4">
          <h3 className="text-xs font-black text-[#afbbbf] uppercase tracking-wider mb-3">
            Add target item to bring:
          </h3>
          <form onSubmit={(e) => { void handleAddItem(e); }} className="flex gap-3">
            <input
              type="text"
              value={newCustomItemName}
              onChange={(e) => setNewCustomItemName(e.target.value)}
              placeholder="e.g., Umbrella, AirPods..."
              className="flex-1 bg-[#131f24] border-2 border-[#37464f] px-4 py-3 rounded-xl font-bold text-sm text-white focus:outline-none focus:border-[#1cb0f6] placeholder-[#afbbbf] transition-colors"
            />
            <button
              type="submit"
              className="bg-[#1cb0f6] border-b-6 border-[#1899d6] hover:brightness-110 text-white px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all active:translate-y-[2px] active:border-b-4 shrink-0 cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
