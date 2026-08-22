"use client";

import React, { useState, useMemo, useDeferredValue } from "react";
import {
  Search,
  X,
  Tag,
  Briefcase,
  Dumbbell,
  Home,
  Compass,
  MapPin,
  Key,
  Wallet,
  CreditCard,
  Banknote,
  Coins,
  Smartphone,
  Laptop,
  Headphones,
  Tablet,
  Watch,
  Camera,
  BatteryCharging,
  Cable,
  Plug,
  Gamepad2,
  Mouse,
  Keyboard,
  HardDrive,
  Speaker,
  Radio,
  Mic,
  Backpack,
  ShoppingBag,
  Luggage,
  Package,
  Umbrella,
  Glasses,
  Sun,
  Fingerprint,
  Pill,
  Cross,
  Heart,
  Activity,
  Droplet,
  Sparkles,
  Thermometer,
  Bandage,
  FlaskConical,
  Shirt,
  Footprints,
  Crown,
  Gem,
  Coffee,
  CupSoda,
  Utensils,
  Apple,
  Sandwich,
  Cookie,
  Wine,
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  Ticket,
  Map,
  Globe,
  Pen,
  BookOpen,
  FileText,
  Folder,
  ClipboardList,
  Calculator,
  Scissors,
  Bookmark,
  StickyNote,
  Wrench,
  Hammer,
  Flashlight,
  Lock,
  Shield,
  Flame,
  Zap,
  Bell,
  Star,
  Smile,
  Trophy,
  Music,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface ItemIconDef {
  name: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

export const ITEM_ICONS: ItemIconDef[] = [
  // Tech & Everyday Electronics
  {
    name: "Phone",
    key: "phone",
    icon: Smartphone,
    tags: ["smartphone", "mobile", "cell", "handphone", "iphone", "android"],
  },
  {
    name: "Laptop",
    key: "laptop",
    icon: Laptop,
    tags: ["macbook", "computer", "pc", "notebook", "work"],
  },
  {
    name: "Headphones",
    key: "headphones",
    icon: Headphones,
    tags: ["earphone", "airpods", "buds", "headset", "audio", "music"],
  },
  {
    name: "Watch",
    key: "watch",
    icon: Watch,
    tags: ["smartwatch", "clock", "time", "apple watch"],
  },
  {
    name: "Tablet",
    key: "tablet",
    icon: Tablet,
    tags: ["ipad", "screen", "ereader", "kindle"],
  },
  {
    name: "Battery",
    key: "battery",
    icon: BatteryCharging,
    tags: ["powerbank", "charger", "power", "energy"],
  },
  {
    name: "Cable",
    key: "cable",
    icon: Cable,
    tags: ["wire", "cord", "usb", "type-c", "lightning", "charger"],
  },
  {
    name: "Plug",
    key: "plug",
    icon: Plug,
    tags: ["adapter", "socket", "wall", "charger", "electricity"],
  },
  {
    name: "Camera",
    key: "camera",
    icon: Camera,
    tags: ["photo", "dslr", "video", "lens", "gopro"],
  },
  {
    name: "Mouse",
    key: "mouse",
    icon: Mouse,
    tags: ["clicker", "pointer", "trackpad", "bluetooth"],
  },
  {
    name: "Keyboard",
    key: "keyboard",
    icon: Keyboard,
    tags: ["typing", "keys", "computer"],
  },
  {
    name: "Gamepad",
    key: "gamepad",
    icon: Gamepad2,
    tags: ["controller", "game", "switch", "console", "playstation", "xbox"],
  },
  {
    name: "Drive",
    key: "harddrive",
    icon: HardDrive,
    tags: ["storage", "flashdrive", "usb", "ssd", "hdd", "thumbdrive"],
  },
  {
    name: "Speaker",
    key: "speaker",
    icon: Speaker,
    tags: ["sound", "audio", "bluetooth", "music"],
  },
  {
    name: "Mic",
    key: "mic",
    icon: Mic,
    tags: ["microphone", "audio", "recording", "voice"],
  },
  {
    name: "Radio",
    key: "radio",
    icon: Radio,
    tags: ["walkie", "transceiver", "fm", "am"],
  },

  // Pocket Essentials & Money
  {
    name: "Key",
    key: "key",
    icon: Key,
    tags: ["keys", "keychain", "house", "car", "lock"],
  },
  {
    name: "Wallet",
    key: "wallet",
    icon: Wallet,
    tags: ["money", "cash", "purse", "billfold"],
  },
  {
    name: "Card",
    key: "card",
    icon: CreditCard,
    tags: ["credit", "debit", "visa", "mastercard", "atm", "payment"],
  },
  {
    name: "Cash",
    key: "banknote",
    icon: Banknote,
    tags: ["money", "bills", "dollars", "currency"],
  },
  {
    name: "Coins",
    key: "coins",
    icon: Coins,
    tags: ["change", "money", "tokens"],
  },
  {
    name: "Glasses",
    key: "glasses",
    icon: Glasses,
    tags: ["spectacles", "sunglasses", "shades", "eye", "vision"],
  },
  {
    name: "Sun",
    key: "sun",
    icon: Sun,
    tags: ["sunglasses", "summer", "weather", "uv"],
  },
  {
    name: "Umbrella",
    key: "umbrella",
    icon: Umbrella,
    tags: ["rain", "storm", "shade", "parasol"],
  },
  {
    name: "ID",
    key: "fingerprint",
    icon: Fingerprint,
    tags: ["badge", "pass", "identity", "security", "biometric"],
  },

  // Bags & Luggage
  {
    name: "Backpack",
    key: "backpack",
    icon: Backpack,
    tags: ["bag", "rucksack", "daypack", "schoolbag", "knapsack"],
  },
  {
    name: "Briefcase",
    key: "briefcase",
    icon: Briefcase,
    tags: ["workbag", "attache", "laptop bag", "office"],
  },
  {
    name: "Bag",
    key: "bag",
    icon: ShoppingBag,
    tags: ["tote", "grocery", "shopping", "pouch", "handbag"],
  },
  {
    name: "Luggage",
    key: "luggage",
    icon: Luggage,
    tags: ["suitcase", "travel", "flight", "trip", "trunk"],
  },
  {
    name: "Package",
    key: "package",
    icon: Package,
    tags: ["parcel", "box", "delivery"],
  },

  // Food & Hydration
  {
    name: "Water",
    key: "cupsoda",
    icon: CupSoda,
    tags: ["bottle", "drink", "beverage", "tumbler", "hydration", "straw"],
  },
  {
    name: "Coffee",
    key: "coffee",
    icon: Coffee,
    tags: ["tea", "mug", "cup", "espresso", "latte", "cafe", "drink"],
  },
  {
    name: "Utensils",
    key: "utensils",
    icon: Utensils,
    tags: ["fork", "spoon", "knife", "cutlery", "lunch", "food"],
  },
  {
    name: "Apple",
    key: "apple",
    icon: Apple,
    tags: ["fruit", "snack", "food", "healthy"],
  },
  {
    name: "Sandwich",
    key: "sandwich",
    icon: Sandwich,
    tags: ["meal", "lunch", "snack", "bread", "burger", "food"],
  },
  {
    name: "Cookie",
    key: "cookie",
    icon: Cookie,
    tags: ["biscuit", "snack", "sweet", "treat"],
  },
  {
    name: "Drink",
    key: "wine",
    icon: Wine,
    tags: ["wine", "alcohol", "bottle", "party"],
  },

  // Health, Care & Personal
  {
    name: "Pill",
    key: "pill",
    icon: Pill,
    tags: ["medicine", "vitamins", "capsule", "drug", "tablet", "medical"],
  },
  {
    name: "First Aid",
    key: "cross",
    icon: Cross,
    tags: ["medical", "emergency", "health", "hospital", "doctor"],
  },
  {
    name: "Bandage",
    key: "bandage",
    icon: Bandage,
    tags: ["bandaid", "plaster", "wound", "first aid"],
  },
  {
    name: "Sanitizer",
    key: "droplet",
    icon: Droplet,
    tags: ["water", "eye drops", "drops", "lotion", "liquid"],
  },
  {
    name: "Spray",
    key: "flask",
    icon: FlaskConical,
    tags: ["perfume", "cologne", "spray", "cosmetics", "lotion"],
  },
  {
    name: "Clean",
    key: "sparkles",
    icon: Sparkles,
    tags: ["hygiene", "cosmetics", "beauty", "clean", "fresh"],
  },
  {
    name: "Thermometer",
    key: "thermometer",
    icon: Thermometer,
    tags: ["temp", "fever", "health"],
  },
  {
    name: "Heart",
    key: "heart",
    icon: Heart,
    tags: ["health", "pulse", "care", "wellness"],
  },
  {
    name: "Activity",
    key: "activity",
    icon: Activity,
    tags: ["fitness", "bpm", "tracker", "workout"],
  },

  // Clothing & Personal Style
  {
    name: "Clothes",
    key: "shirt",
    icon: Shirt,
    tags: ["top", "t-shirt", "jacket", "apparel", "uniform"],
  },
  {
    name: "Shoes",
    key: "shoes",
    icon: Footprints,
    tags: ["footprints", "sneakers", "boots", "socks", "sandals"],
  },
  {
    name: "Hat",
    key: "crown",
    icon: Crown,
    tags: ["cap", "beanie", "helmet", "headwear"],
  },
  {
    name: "Jewelry",
    key: "gem",
    icon: Gem,
    tags: ["ring", "necklace", "earring", "bracelet", "valuable"],
  },

  // Work, Study & Stationery
  {
    name: "Pen",
    key: "pen",
    icon: Pen,
    tags: ["pencil", "write", "stationery", "marker", "stylus"],
  },
  {
    name: "Book",
    key: "book",
    icon: BookOpen,
    tags: ["reading", "notebook", "novel", "textbook"],
  },
  {
    name: "Notes",
    key: "file",
    icon: FileText,
    tags: ["document", "paper", "contract", "receipt", "forms"],
  },
  {
    name: "Folder",
    key: "folder",
    icon: Folder,
    tags: ["files", "documents", "portfolio"],
  },
  {
    name: "List",
    key: "clipboard",
    icon: ClipboardList,
    tags: ["checklist", "tasks", "notes", "agenda"],
  },
  {
    name: "Calculator",
    key: "calculator",
    icon: Calculator,
    tags: ["math", "finance", "accounting"],
  },
  {
    name: "Scissors",
    key: "scissors",
    icon: Scissors,
    tags: ["cut", "craft", "stationery"],
  },
  {
    name: "Bookmark",
    key: "bookmark",
    icon: Bookmark,
    tags: ["tag", "marker", "save"],
  },
  {
    name: "Sticky Note",
    key: "stickynote",
    icon: StickyNote,
    tags: ["memo", "postit", "reminder"],
  },

  // Travel & Commute
  {
    name: "Car",
    key: "car",
    icon: Car,
    tags: ["drive", "vehicle", "auto", "keys"],
  },
  {
    name: "Bike",
    key: "bike",
    icon: Bike,
    tags: ["bicycle", "cycling", "scooter"],
  },
  {
    name: "Bus",
    key: "bus",
    icon: Bus,
    tags: ["transit", "commute", "coach"],
  },
  {
    name: "Train",
    key: "train",
    icon: Train,
    tags: ["subway", "metro", "rail", "commute"],
  },
  {
    name: "Flight",
    key: "plane",
    icon: Plane,
    tags: ["airplane", "airport", "travel", "holiday"],
  },
  {
    name: "Ticket",
    key: "ticket",
    icon: Ticket,
    tags: ["boarding pass", "pass", "cinema", "event", "concert", "entry"],
  },
  {
    name: "Map",
    key: "map",
    icon: Map,
    tags: ["atlas", "guide", "directions", "route"],
  },
  {
    name: "Globe",
    key: "globe",
    icon: Globe,
    tags: ["world", "international", "passport", "travel"],
  },
  {
    name: "Compass",
    key: "compass",
    icon: Compass,
    tags: ["navigation", "direction", "outdoor"],
  },
  {
    name: "Location",
    key: "pin",
    icon: MapPin,
    tags: ["mappin", "place", "address", "gps"],
  },

  // Tools & Security
  {
    name: "Tools",
    key: "wrench",
    icon: Wrench,
    tags: ["spanner", "repair", "maintenance", "hardware"],
  },
  {
    name: "Hammer",
    key: "hammer",
    icon: Hammer,
    tags: ["tool", "build", "hardware"],
  },
  {
    name: "Torch",
    key: "flashlight",
    icon: Flashlight,
    tags: ["light", "lantern", "night", "beam"],
  },
  {
    name: "Lock",
    key: "lock",
    icon: Lock,
    tags: ["padlock", "security", "safe"],
  },
  {
    name: "Shield",
    key: "shield",
    icon: Shield,
    tags: ["protection", "security", "mask"],
  },
  {
    name: "Flame",
    key: "flame",
    icon: Flame,
    tags: ["lighter", "match", "fire", "heat"],
  },
  {
    name: "Power",
    key: "zap",
    icon: Zap,
    tags: ["lightning", "electricity", "energy", "charge"],
  },
  {
    name: "Bell",
    key: "bell",
    icon: Bell,
    tags: ["alarm", "notification", "ring", "reminder"],
  },
  {
    name: "Tag",
    key: "tag",
    icon: Tag,
    tags: ["label", "item", "category", "price"],
  },
  {
    name: "Star",
    key: "star",
    icon: Star,
    tags: ["favorite", "priority", "important", "special"],
  },
  {
    name: "Smile",
    key: "smile",
    icon: Smile,
    tags: ["happy", "fun", "emoji", "mood"],
  },
  {
    name: "Gym",
    key: "dumbbell",
    icon: Dumbbell,
    tags: ["fitness", "workout", "weights", "exercise"],
  },
  {
    name: "Trophy",
    key: "trophy",
    icon: Trophy,
    tags: ["award", "win", "achievement", "sports"],
  },
  {
    name: "Music",
    key: "music",
    icon: Music,
    tags: ["song", "track", "audio", "melody"],
  },
];

export const ITEM_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = ITEM_ICONS.reduce(
  (acc, curr) => {
    acc[curr.key] = curr.icon;
    return acc;
  },
  {} as Record<string, React.ComponentType<{ className?: string }>>
);

export function renderRoutineIcon(iconStr?: string) {
  if (!iconStr) return <MapPin className="w-5 h-5" />;
  const normalized = iconStr.toLowerCase().trim();
  const IconComp = ITEM_ICON_MAP[normalized];
  if (IconComp) {
    return <IconComp className="w-5 h-5 shrink-0" />;
  }
  if (iconStr.match(/\p{Emoji}/u)) {
    return <span className="text-base leading-none shrink-0">{iconStr}</span>;
  }
  if (
    normalized.includes("work") ||
    normalized.includes("briefcase") ||
    normalized.includes("office")
  ) {
    return <Briefcase className="w-5 h-5" />;
  }
  if (
    normalized.includes("gym") ||
    normalized.includes("fitness") ||
    normalized.includes("workout")
  ) {
    return <Dumbbell className="w-5 h-5" />;
  }
  if (normalized.includes("home") || normalized.includes("house")) {
    return <Home className="w-5 h-5" />;
  }
  if (
    normalized.includes("travel") ||
    normalized.includes("trip") ||
    normalized.includes("flight") ||
    normalized.includes("compass")
  ) {
    return <Compass className="w-5 h-5" />;
  }
  if (normalized === "tag") {
    return <Tag className="w-5 h-5" />;
  }
  return <MapPin className="w-5 h-5" />;
}

export function renderItemIcon(iconKey?: string) {
  if (!iconKey) return null;
  const key = iconKey.toLowerCase().trim();
  const IconComp = ITEM_ICON_MAP[key];
  if (IconComp) {
    return (
      <IconComp className="w-4 h-4 text-primary shrink-0 inline-block mr-1.5" />
    );
  }
  if (iconKey.match(/\p{Emoji}/u)) {
    return <span className="mr-1.5">{iconKey}</span>;
  }
  return (
    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm mr-1.5 font-mono">
      {iconKey}
    </span>
  );
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
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const cleanQuery = deferredSearch.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!cleanQuery) return ITEM_ICONS;
    return ITEM_ICONS.filter(
      (item) =>
        item.name.toLowerCase().includes(cleanQuery) ||
        item.key.toLowerCase().includes(cleanQuery) ||
        item.tags.some((tag) => tag.includes(cleanQuery))
    );
  }, [cleanQuery]);

  const hasDirectEmojiOrCustom = cleanQuery.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-black">
            <Tag className="w-4 h-4 text-primary" /> Select Item Icon
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1 select-none">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 80+ icons (e.g. phone, water, bottle, pen, cash)..."
              className="pl-9 pr-8 text-xs"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1 pr-1.5">
            {/* None Option */}
            <button
              type="button"
              onClick={() => {
                onSelectIcon("");
                onOpenChange(false);
                setSearch("");
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs gap-1 transition-all cursor-pointer ${
                !selectedKey
                  ? "border-primary bg-primary/10 text-primary font-black"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              <X className="w-4 h-4 opacity-50" />
              <span className="text-[10px] truncate max-w-full">None</span>
            </button>

            {/* Custom Emoji / Query button if searching */}
            {hasDirectEmojiOrCustom && (
              <button
                type="button"
                onClick={() => {
                  onSelectIcon(search.trim());
                  onOpenChange(false);
                  setSearch("");
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-primary bg-primary/5 hover:bg-primary/15 text-primary text-xs gap-1 transition-all cursor-pointer"
                title={`Use "${search.trim()}" directly`}
              >
                <span className="text-base leading-none">
                  {search.trim().slice(0, 2)}
                </span>
                <span className="text-[9px] font-black truncate max-w-full">
                  Use Text
                </span>
              </button>
            )}

            {filtered.map((item) => {
              const IconComp = item.icon;
              const isSelected = selectedKey?.toLowerCase() === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectIcon(item.key);
                    onOpenChange(false);
                    setSearch("");
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-black shadow-xs"
                      : "border-border hover:bg-muted/80 text-foreground"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span className="text-[10px] truncate max-w-full">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-2 font-bold">
              No matching icons found. Tap &quot;Use Text&quot; above to use &quot;{search.trim()}&quot;!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
