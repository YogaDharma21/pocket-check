"use client";

import { useState } from "react";
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
  Smartphone,
  Laptop,
  Headphones,
  Tablet,
  Watch,
  Camera,
  BatteryCharging,
  Plug,
  Backpack,
  ShoppingBag,
  Luggage,
  Umbrella,
  Glasses,
  Sun,
  Pill,
  Heart,
  Shield,
  Activity,
  FileText,
  BookOpen,
  Coffee,
  Utensils,
  Smile,
  Star,
  Flame,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const ITEM_ICONS: {
  name: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { name: "Key", key: "key", icon: Key },
  { name: "Wallet", key: "wallet", icon: Wallet },
  { name: "Card", key: "card", icon: CreditCard },
  { name: "Phone", key: "phone", icon: Smartphone },
  { name: "Laptop", key: "laptop", icon: Laptop },
  { name: "Headphones", key: "headphones", icon: Headphones },
  { name: "Tablet", key: "tablet", icon: Tablet },
  { name: "Watch", key: "watch", icon: Watch },
  { name: "Camera", key: "camera", icon: Camera },
  { name: "Battery", key: "battery", icon: BatteryCharging },
  { name: "Plug", key: "plug", icon: Plug },
  { name: "Backpack", key: "backpack", icon: Backpack },
  { name: "Briefcase", key: "briefcase", icon: Briefcase },
  { name: "Bag", key: "bag", icon: ShoppingBag },
  { name: "Luggage", key: "luggage", icon: Luggage },
  { name: "Umbrella", key: "umbrella", icon: Umbrella },
  { name: "Glasses", key: "glasses", icon: Glasses },
  { name: "Sun", key: "sun", icon: Sun },
  { name: "Pill", key: "pill", icon: Pill },
  { name: "Heart", key: "heart", icon: Heart },
  { name: "Shield", key: "shield", icon: Shield },
  { name: "Activity", key: "activity", icon: Activity },
  { name: "File", key: "file", icon: FileText },
  { name: "Book", key: "book", icon: BookOpen },
  { name: "Coffee", key: "coffee", icon: Coffee },
  { name: "Utensils", key: "utensils", icon: Utensils },
  { name: "Smile", key: "smile", icon: Smile },
  { name: "Star", key: "star", icon: Star },
  { name: "Tag", key: "tag", icon: Tag },
  { name: "Flame", key: "flame", icon: Flame },
  { name: "Zap", key: "zap", icon: Zap },
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

export function renderRoutineIcon(iconStr: string) {
  const normalized = (iconStr || "").toLowerCase().trim();
  if (normalized.includes("work") || normalized.includes("briefcase")) {
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
    normalized.includes("compass")
  ) {
    return <Compass className="w-5 h-5" />;
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

  const filtered = ITEM_ICONS.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
              placeholder="Search icons (e.g. key, phone, wallet, bag)..."
              className="pl-9 text-xs"
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

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onSelectIcon("");
                onOpenChange(false);
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
