import React, { useState, useEffect, useMemo } from "react";
import {
  icons as LucideIcons,
  Search,
  X,
  Tag,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Common synonyms dictionary mapping search keywords to specific Lucide icons
const ICON_SYNONYMS: Record<string, string[]> = {
  chat: [
    "MessageCircle",
    "MessageSquare",
    "MessagesSquare",
    "BotMessageSquare",
    "MessageCircleCode",
    "MessageCircleHeart",
    "Send",
    "Mail",
    "Speech",
  ],
  talk: ["MessageCircle", "MessageSquare", "MessagesSquare", "Mic", "Speech"],
  message: [
    "MessageCircle",
    "MessageSquare",
    "MessagesSquare",
    "Mail",
    "Inbox",
    "Send",
    "BotMessageSquare",
  ],
  water: ["CupSoda", "GlassWater", "Droplet", "Droplets", "Waves", "Milk"],
  bottle: ["CupSoda", "Wine", "GlassWater", "Milk"],
  drink: ["CupSoda", "Coffee", "Wine", "GlassWater", "Beer", "Milk"],
  charger: ["Cable", "Plug", "BatteryCharging", "Zap", "Power"],
  cord: ["Cable", "Plug"],
  wire: ["Cable"],
  money: ["Wallet", "Banknote", "Coins", "CreditCard", "DollarSign"],
  cash: ["Wallet", "Banknote", "Coins", "CreditCard"],
  card: ["CreditCard", "IdCard", "Contact"],
  food: [
    "Utensils",
    "Apple",
    "Sandwich",
    "Cookie",
    "Pizza",
    "Salad",
    "Croissant",
    "Soup",
    "Cake",
    "Beef",
    "Egg",
  ],
  snack: ["Apple", "Sandwich", "Cookie", "Candy", "Popcorn"],
  lunch: ["Utensils", "Sandwich", "Apple", "Salad", "Soup"],
  medicine: [
    "Pill",
    "Cross",
    "Bandage",
    "Stethoscope",
    "Thermometer",
    "Syringe",
    "HeartPulse",
  ],
  medical: [
    "Pill",
    "Cross",
    "Bandage",
    "Stethoscope",
    "Thermometer",
    "Hospital",
    "ShieldAlert",
  ],
  bandaid: ["Bandage", "Cross"],
  keys: ["Key", "KeyRound", "KeySquare", "Lock", "Unlock"],
  pen: ["Pen", "PenTool", "Pencil", "Feather", "Highlighter"],
  pencil: ["Pencil", "Pen", "PenTool"],
  paper: ["File", "FileText", "StickyNote", "Files", "Newspaper"],
  notebook: ["Book", "BookOpen", "Notebook", "NotebookTabs", "FileText"],
  book: ["Book", "BookOpen", "BookMarked", "Notebook", "Library"],
  shoes: ["Footprints"],
  hat: ["Crown"],
  gym: ["Dumbbell", "Activity", "Trophy", "Flame", "Timer", "BicepsFlexed"],
  workout: ["Dumbbell", "Activity", "HeartPulse", "Timer", "Flame"],
  travel: [
    "Plane",
    "Luggage",
    "Compass",
    "Map",
    "Globe",
    "Ticket",
    "Palmtree",
    "Hotel",
  ],
  trip: ["Plane", "Luggage", "Compass", "Map", "Globe", "Ticket"],
  flight: ["Plane", "Ticket", "Luggage", "Compass"],
  plane: ["Plane", "PlaneTakeoff", "PlaneLanding", "Ticket"],
  car: ["Car", "CarFront", "KeyRound", "Fuel", "Gauge"],
  bike: ["Bike"],
  bicycle: ["Bike"],
  train: ["Train", "TramFront"],
  bag: [
    "Backpack",
    "Briefcase",
    "ShoppingBag",
    "Luggage",
    "Package",
    "Handbag",
  ],
  clothes: ["Shirt", "Footprints", "Glasses", "Crown", "Watch"],
  music: ["Music", "Headphones", "Speaker", "Mic", "Radio", "Volume2", "Disc"],
  photo: ["Camera", "Video", "Film", "Image"],
  settings: ["Settings", "Sliders", "Wrench", "Tool"],
  tools: [
    "Wrench",
    "Hammer",
    "Screwdriver",
    "Scissors",
    "Flashlight",
    "Drill",
    "Axe",
  ],
  time: ["Clock", "Watch", "Timer", "Hourglass"],
  star: ["Star", "Sparkles", "Heart", "Bookmark"],
  user: ["User", "Users", "UserCheck", "Contact", "Fingerprint"],
  profile: ["User", "Users", "Contact"],
  security: ["Shield", "ShieldCheck", "Lock", "Key", "Fingerprint"],
  mask: ["Shield", "Smile"],
  perfume: ["FlaskConical", "Sparkles", "Droplet"],
  spray: ["FlaskConical", "Droplet"],
  clean: ["Sparkles", "Droplet", "Check"],
  wifi: ["Wifi", "Radio", "Zap"],
  bluetooth: ["Bluetooth", "Headphones", "Speaker"],
  game: ["Gamepad2", "Joystick", "Dices", "Trophy"],
  controller: ["Gamepad2", "Joystick"],
  bell: ["Bell", "BellRing", "AlarmClock"],
  alarm: ["AlarmClock", "Bell", "Timer"],
  lock: ["Lock", "Key", "Shield", "Unlock"],
  trash: ["Trash2", "Trash", "Archive"],
  delete: ["Trash2", "Trash", "X"],
  edit: ["Pencil", "Pen", "FilePen", "Edit"],
  check: ["Check", "CheckCircle", "CheckCheck", "ListTodo", "CheckSquare"],
  checklist: ["ClipboardList", "CheckSquare", "ListTodo", "List"],
};

// Curated list of popular daily essentials shown when search query is empty
const POPULAR_DEFAULT_ICONS = [
  "Key",
  "Wallet",
  "CreditCard",
  "Banknote",
  "Smartphone",
  "Laptop",
  "Headphones",
  "Watch",
  "Tablet",
  "BatteryCharging",
  "Cable",
  "Plug",
  "Camera",
  "Gamepad2",
  "Glasses",
  "Sun",
  "Umbrella",
  "Fingerprint",
  "Backpack",
  "Briefcase",
  "ShoppingBag",
  "Luggage",
  "Package",
  "CupSoda",
  "Coffee",
  "Utensils",
  "Apple",
  "Sandwich",
  "Cookie",
  "Wine",
  "Pill",
  "Cross",
  "Bandage",
  "Droplet",
  "FlaskConical",
  "Sparkles",
  "Thermometer",
  "Heart",
  "Activity",
  "Shirt",
  "Footprints",
  "Crown",
  "Gem",
  "Pen",
  "BookOpen",
  "FileText",
  "Folder",
  "ClipboardList",
  "Calculator",
  "Scissors",
  "Bookmark",
  "StickyNote",
  "Car",
  "Bike",
  "Bus",
  "Train",
  "Plane",
  "Ticket",
  "Map",
  "Globe",
  "Compass",
  "MapPin",
  "Wrench",
  "Hammer",
  "Flashlight",
  "Lock",
  "Shield",
  "Flame",
  "Zap",
  "Bell",
  "Tag",
  "Star",
  "Smile",
  "Dumbbell",
  "Trophy",
  "Music",
  "MessageCircle",
  "MessageSquare",
  "Wifi",
  "User",
];

// Helper to convert PascalCase to human-readable label (e.g. "MessageCircle" -> "Message Circle")
function formatIconName(pascalName: string): string {
  return pascalName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^Lucide\s*/, "");
}

const allIcons = LucideIcons as unknown as Record<
  string,
  React.ComponentType<{ className?: string }>
>;

// Convert any format (kebab, lower, camel) to matching Lucide component
export function getLucideIcon(
  key?: string
): React.ComponentType<{ className?: string }> | null {
  if (!key) return null;
  const clean = key.trim();

  // 1. Direct key match in allIcons dictionary
  if (clean in allIcons) {
    return allIcons[clean];
  }

  // 2. PascalCase conversion
  const pascal = clean
    .replace(/[-_ ]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toUpperCase());

  if (pascal in allIcons) {
    return allIcons[pascal];
  }

  // 3. Case-insensitive search fallback
  const lower = clean.toLowerCase();
  for (const [name, Comp] of Object.entries(allIcons)) {
    if (name.toLowerCase() === lower) {
      return Comp;
    }
  }

  return null;
}

export function renderItemIcon(iconKey?: string) {
  if (!iconKey) return null;
  const Comp = getLucideIcon(iconKey);
  if (Comp) {
    return (
      <Comp className="w-4 h-4 text-primary shrink-0 inline-block mr-1.5" />
    );
  }
  if (iconKey.match(/\p{Emoji}/u)) {
    return <span className="mr-1.5">{iconKey}</span>;
  }
  return (
    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-lg mr-1.5 font-mono">
      {iconKey}
    </span>
  );
}

export function renderRoutineIcon(iconStr?: string) {
  if (!iconStr) {
    const MapPin = allIcons["MapPin"];
    return MapPin ? <MapPin className="w-5 h-5" /> : null;
  }
  const Comp = getLucideIcon(iconStr);
  if (Comp) {
    return <Comp className="w-5 h-5 shrink-0" />;
  }
  if (iconStr.match(/\p{Emoji}/u)) {
    return <span className="text-base leading-none shrink-0">{iconStr}</span>;
  }
  const lower = iconStr.toLowerCase().trim();
  if (
    lower.includes("work") ||
    lower.includes("office") ||
    lower.includes("briefcase")
  ) {
    const Briefcase = allIcons["Briefcase"];
    return Briefcase ? <Briefcase className="w-5 h-5" /> : null;
  }
  if (
    lower.includes("gym") ||
    lower.includes("workout") ||
    lower.includes("fitness")
  ) {
    const Dumbbell = allIcons["Dumbbell"];
    return Dumbbell ? <Dumbbell className="w-5 h-5" /> : null;
  }
  if (lower.includes("home") || lower.includes("house")) {
    const Home = allIcons["Home"];
    return Home ? <Home className="w-5 h-5" /> : null;
  }
  if (
    lower.includes("travel") ||
    lower.includes("trip") ||
    lower.includes("flight") ||
    lower.includes("compass")
  ) {
    const Compass = allIcons["Compass"];
    return Compass ? <Compass className="w-5 h-5" /> : null;
  }
  if (
    lower.includes("campus") ||
    lower.includes("school") ||
    lower.includes("college") ||
    lower.includes("university") ||
    lower.includes("study") ||
    lower.includes("graduat")
  ) {
    const GraduationCap = allIcons["GraduationCap"];
    return GraduationCap ? <GraduationCap className="w-5 h-5" /> : null;
  }
  const MapPin = allIcons["MapPin"];
  return MapPin ? <MapPin className="w-5 h-5" /> : null;
}

export function IconPickerModal({
  open,
  onOpenChange,
  onSelectIcon,
  selectedKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIcon: (key: string) => void;
  selectedKey?: string;
}) {
  if (!open) return null;

  return (
    <IconPickerModalInner
      open={open}
      onOpenChange={onOpenChange}
      onSelectIcon={onSelectIcon}
      selectedKey={selectedKey}
    />
  );
}

function IconPickerModalInner({
  open,
  onOpenChange,
  onSelectIcon,
  selectedKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIcon: (key: string) => void;
  selectedKey?: string;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  };

  // Search debounce with shimmer skeleton feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
    }, 140);

    return () => clearTimeout(timer);
  }, [search]);

  const clean = debouncedSearch.trim().toLowerCase();

  const matchedIconNames = useMemo(() => {
    if (!clean) return POPULAR_DEFAULT_ICONS;

    const results = new Set<string>();

    // 1. Check synonym dictionary
    for (const [synonymKey, iconNames] of Object.entries(ICON_SYNONYMS)) {
      if (synonymKey.includes(clean) || clean.includes(synonymKey)) {
        iconNames.forEach((name) => {
          if (name in allIcons) results.add(name);
        });
      }
    }

    // 2. Scan all Lucide icons
    for (const iconName of Object.keys(allIcons)) {
      const lowerName = iconName.toLowerCase();
      const readable = formatIconName(iconName).toLowerCase();
      const kebab = iconName
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase();

      if (
        lowerName.includes(clean) ||
        readable.includes(clean) ||
        kebab.includes(clean)
      ) {
        results.add(iconName);
      }

      // Limit results to 120 for fast DOM rendering
      if (results.size >= 120) break;
    }

    return Array.from(results);
  }, [clean]);

  const cleanQuery = search.trim();
  const hasCustomQuery = cleanQuery.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Tag className="w-5 h-5 text-foreground" /> Select Icon
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1 select-none">
          {/* Search Bar */}
          <div className="relative">
            {isSearching ? (
              <Loader2 className="w-4 h-4 absolute left-3.5 top-3.5 text-primary animate-spin" />
            ) : (
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
            )}
            <Input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search any icon (e.g. chat, wifi, bottle, car, bot)..."
              className="h-11 pl-10 pr-9 text-sm bg-muted/40 border-border/80 rounded-xl"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Icon Grid / Shimmer Skeleton */}
          {isSearching ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-80 overflow-y-auto p-1 pr-1.5 animate-fadeIn">
              {Array.from({ length: 18 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/50 gap-1.5 h-[70px]"
                >
                  <Skeleton className="w-5 h-5 rounded-lg" />
                  <Skeleton className="w-10 h-2.5 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-80 overflow-y-auto p-1 pr-1.5 animate-fadeIn">
              {/* None Option */}
              <button
                type="button"
                onClick={() => {
                  onSelectIcon("");
                  onOpenChange(false);
                  handleSearchChange("");
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs gap-1.5 transition-all cursor-pointer h-[70px] ${
                  !selectedKey
                    ? "border-foreground ring-2 ring-foreground/20 bg-muted/80 text-foreground font-bold shadow-xs"
                    : "border-border/70 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <X className="w-5 h-5 opacity-70" />
                <span className="text-[10px] truncate max-w-full font-semibold">None</span>
              </button>

              {/* Custom Query / Direct Text Button */}
              {hasCustomQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectIcon(cleanQuery);
                    onOpenChange(false);
                    handleSearchChange("");
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-primary bg-primary/10 hover:bg-primary/20 text-primary text-xs gap-1.5 transition-all cursor-pointer h-[70px]"
                  title={`Use "${cleanQuery}" directly`}
                >
                  <span className="text-lg leading-none font-bold">
                    {cleanQuery.slice(0, 2)}
                  </span>
                  <span className="text-[9px] font-black truncate max-w-full">
                    Use Text
                  </span>
                </button>
              )}

              {/* Icon Matches */}
              {matchedIconNames.map((iconName) => {
                const IconComp = getLucideIcon(iconName);
                if (!IconComp) return null;

                const isSelected =
                  selectedKey?.toLowerCase() === iconName.toLowerCase();
                const displayName = formatIconName(iconName);

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onSelectIcon(iconName);
                      onOpenChange(false);
                      handleSearchChange("");
                    }}
                    title={displayName}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs gap-1.5 transition-all cursor-pointer h-[70px] ${
                      isSelected
                        ? "border-foreground ring-2 ring-foreground/20 bg-muted/80 text-foreground font-bold shadow-xs"
                        : "border-border/70 bg-card/40 hover:bg-muted/60 text-foreground hover:text-foreground"
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-[10px] truncate max-w-full text-center px-0.5 font-semibold">
                      {displayName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* No results message */}
          {!isSearching && matchedIconNames.length === 0 && (
            <div className="text-center py-4 space-y-1">
              <p className="text-xs font-bold text-muted-foreground">
                No icon matches for &quot;{cleanQuery}&quot;.
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tap &quot;Use Text&quot; above to set &quot;{cleanQuery}&quot; or any emoji as your icon!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
