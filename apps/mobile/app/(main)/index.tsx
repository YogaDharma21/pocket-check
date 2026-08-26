import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Colors } from "../../constants/theme";

import { ProgressCard } from "../../components/ProgressCard";
import { RoutineSwitcher, RoutineItem } from "../../components/RoutineSwitcher";
import { FilterTabs, FilterType } from "../../components/FilterTabs";
import { ChecklistItem, ItemData } from "../../components/ChecklistItem";
import { AddItemForm } from "../../components/AddItemForm";
import { IconPickerModal } from "../../components/IconPicker";
import { RoutineSettingsModal } from "../../components/RoutineSettingsModal";
import { ItemSettingsModal } from "../../components/ItemSettingsModal";
import { AboutModal } from "../../components/AboutModal";
import { MenuModal } from "../../components/MenuModal";
import { SmartPresetsModal } from "../../components/SmartPresetsModal";
import { SmartIntelligenceBanner } from "../../components/SmartIntelligenceBanner";
import { WeatherBanner } from "../../components/WeatherBanner";
import { ExportModal } from "../../components/ExportModal";
import { ShareRoutineModal } from "../../components/ShareRoutineModal";
import { ScheduleModal } from "../../components/ScheduleModal";
import { UndoToast } from "../../components/UndoToast";
import { UserProfileModal } from "../../components/UserProfileModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { PresetRoutine } from "../../lib/presets";

interface RestorableItem {
  routine: string;
  name: string;
  isPacked: boolean;
  emoji?: string;
  quantity?: number;
  locationNote?: string;
  order?: number;
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const theme = colorScheme;
  const colors = Colors[theme];
  const router = useRouter();

  const { signOut } = useAuth();
  const { user } = useUser();

  const [selectedRoutine, setSelectedRoutine] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Modals state
  const [manageRoutine, setManageRoutine] = useState<RoutineItem | null>(null);
  const [manageItem, setManageItem] = useState<ItemData | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<"newItem" | "editItem">("newItem");
  const [newItemIconKey, setNewItemIconKey] = useState<string>("");
  const [editItemIconKey, setEditItemIconKey] = useState<string>("");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTargetRoutine, setScheduleTargetRoutine] = useState<RoutineItem | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    variant: "destructive" | "warning" | "primary";
    onConfirm: () => void;
  } | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Undo Toast state
  const [undoToast, setUndoToast] = useState<{
    message: string;
    items: RestorableItem[];
  } | null>(null);

  // Convex mutations & queries
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

  const rawRoutines = useQuery(api.pocketcheck.listRoutines);
  const isRoutinesLoading = rawRoutines === undefined;
  const routines: RoutineItem[] = (rawRoutines ?? []).map((r) => ({
    _id: r._id,
    name: r.name,
    icon: r.icon,
    order: r.order,
    autoResetTime: r.autoResetTime,
    autoResetDays: r.autoResetDays,
    lastResetDate: r.lastResetDate,
  }));

  const activeRoutine = routines.find((r) => r.name === selectedRoutine);
  const effectiveRoutine = activeRoutine
    ? activeRoutine.name
    : routines.length > 0
    ? routines[0].name
    : "";

  const currentRoutineObj = routines.find((r) => r.name === effectiveRoutine);

  const rawItems = useQuery(
    api.pocketcheck.listItems,
    effectiveRoutine ? { routine: effectiveRoutine } : "skip"
  );
  const isItemsLoading = effectiveRoutine ? rawItems === undefined : false;

  useEffect(() => {
    void ensureInitialized();
  }, [ensureInitialized]);

  // Auto-Reset Time check per routine (background check interval)
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
          await checkAndExecuteAutoReset({
            routineId: currentRoutineObj._id,
            currentDateStr: todayStr,
          });
        } catch (err) {
          console.warn("Auto-reset execution failed", err);
        }
      }
    };

    void checkSchedule();
    const timer = setInterval(checkSchedule, 30000);
    return () => clearInterval(timer);
  }, [currentRoutineObj, checkAndExecuteAutoReset]);

  const items: ItemData[] = (rawItems ?? []).map((i) => ({
    _id: i._id,
    routine: i.routine,
    name: i.name,
    isPacked: i.isPacked,
    emoji: i.emoji,
    quantity: i.quantity,
    locationNote: i.locationNote,
    order: i.order,
  }));

  // Calculations
  const totalItems = items.length;
  const packedItems = items.filter((i) => i.isPacked).length;
  const missingItems = totalItems - packedItems;

  const filteredItems = items.filter((item) => {
    if (filter === "packed") return item.isPacked;
    if (filter === "missing") return !item.isPacked;
    return true;
  });

  // Undo Toast Trigger
  const triggerUndo = (message: string, itemsToRestore: RestorableItem[]) => {
    setUndoToast({ message, items: itemsToRestore });
  };

  const handleExecuteUndo = async () => {
    if (!undoToast || undoToast.items.length === 0) return;
    try {
      await restoreItems({ items: undoToast.items });
      setUndoToast(null);
    } catch (err) {
      console.error("Failed to restore items", err);
    }
  };

  // Handlers
  const handleToggle = async (itemId: Id<"items">, currentPacked: boolean) => {
    try {
      await toggleItem({ id: itemId, isPacked: !currentPacked });
    } catch (err) {
      console.error("Failed to toggle item", err);
    }
  };

  const handleReset = async () => {
    if (!effectiveRoutine) return;
    try {
      await resetItems({ routine: effectiveRoutine });
    } catch (err) {
      console.error("Failed to reset list", err);
    }
  };

  const handleClearList = () => {
    if (!effectiveRoutine) return;
    setConfirmDialog({
      visible: true,
      title: "Clear All Items",
      message: `Are you sure you want to delete all items in "${effectiveRoutine}"? This action cannot be undone.`,
      confirmText: "Delete All Items",
      cancelText: "Keep Items",
      variant: "destructive",
      onConfirm: async () => {
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
          await deleteAllItems({ routine: effectiveRoutine });
          if (backupItems.length > 0) {
            triggerUndo(
              `Cleared ${backupItems.length} items from ${effectiveRoutine}`,
              backupItems
            );
          }
        } catch (err) {
          console.error("Failed to clear list", err);
        }
      },
    });
  };

  const handleCreateRoutine = async (name: string, icon: string) => {
    try {
      await addRoutine({ name, icon });
      setSelectedRoutine(name);
    } catch (err) {
      console.error("Failed to create routine", err);
    }
  };

  const handleSaveRoutine = async (id: Id<"routines">, newName: string) => {
    try {
      const routine = routines.find((r) => r._id === id);
      if (!routine) return;
      await updateRoutine({
        id,
        name: newName,
        icon: routine.icon || "tag",
        autoResetTime: routine.autoResetTime,
        autoResetDays: routine.autoResetDays,
      });
      if (selectedRoutine === routine.name || effectiveRoutine === routine.name) {
        setSelectedRoutine(newName);
      }
    } catch (err) {
      console.error("Failed to update routine", err);
    }
  };

  const handleDeleteRoutine = async (id: Id<"routines">) => {
    try {
      const routineToDelete = routines.find((r) => r._id === id);
      await deleteRoutine({ id });
      if (routineToDelete && (selectedRoutine === routineToDelete.name || effectiveRoutine === routineToDelete.name)) {
        const remaining = routines.filter((r) => r._id !== id);
        setSelectedRoutine(remaining.length > 0 ? remaining[0].name : "");
      }
    } catch (err) {
      console.error("Failed to delete routine", err);
    }
  };

  const handleMoveRoutine = async (id: Id<"routines">, direction: -1 | 1) => {
    const index = routines.findIndex((r) => r._id === id);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= routines.length) return;
    try {
      const ids = routines.map((r) => r._id);
      const [moved] = ids.splice(index, 1);
      ids.splice(targetIndex, 0, moved);
      await reorderRoutines({ ids });
    } catch (err) {
      console.error("Failed to reorder routines", err);
    }
  };

  const handleSelectPreset = async (preset: PresetRoutine, targetRoutine?: string) => {
    const routineNameToUse = targetRoutine || preset.name;
    setSelectedRoutine(routineNameToUse);

    try {
      const res = await applyPreset({
        name: preset.name,
        icon: preset.icon,
        items: preset.items.map((i) => ({
          name: i.name,
          ...(i.emoji ? { emoji: i.emoji } : {}),
          ...(i.quantity ? { quantity: i.quantity } : {}),
          ...(i.locationNote ? { locationNote: i.locationNote } : {}),
        })),
        ...(targetRoutine ? { targetRoutine } : {}),
      });
      if (res?.routineName) {
        setSelectedRoutine(res.routineName);
      }
    } catch (err) {
      console.warn("applyPreset fallback:", err);
      const existingRoutine = routines.find(
        (r) => r.name.toLowerCase().trim() === routineNameToUse.toLowerCase().trim()
      );
      if (!existingRoutine) {
        await addRoutine({
          name: routineNameToUse,
          icon: preset.icon,
        });
      }
      setSelectedRoutine(routineNameToUse);

      const existingNames = new Set(items.map((i) => i.name.toLowerCase().trim()));
      const newItems = preset.items.filter(
        (i) => !existingNames.has(i.name.toLowerCase().trim())
      );
      if (newItems.length > 0) {
        await addItemsBatch({
          routine: routineNameToUse,
          items: newItems.map((i) => ({
            name: i.name,
            emoji: i.emoji,
            quantity: i.quantity,
            locationNote: i.locationNote,
          })),
        });
      }
    }
  };

  const handleAddItem = async (name: string, iconKey?: string) => {
    if (!effectiveRoutine) return;
    try {
      await addItem({
        routine: effectiveRoutine,
        name,
        emoji: iconKey || undefined,
      });
      setNewItemIconKey("");
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  const handleAddItemsBatch = async (batchItems: { name: string; emoji?: string }[]) => {
    if (!effectiveRoutine || batchItems.length === 0) return;
    try {
      await addItemsBatch({
        routine: effectiveRoutine,
        items: batchItems,
      });
      setNewItemIconKey("");
    } catch (err) {
      console.warn("addItemsBatch fallback", err);
      for (const item of batchItems) {
        await addItem({
          routine: effectiveRoutine,
          name: item.name,
          emoji: item.emoji,
        });
      }
      setNewItemIconKey("");
    }
  };

  const handleSaveItem = async (
    id: Id<"items">,
    newName: string,
    iconKey?: string,
    quantity?: number,
    locationNote?: string
  ) => {
    try {
      await editItemMutation({
        id,
        name: newName,
        emoji: iconKey || undefined,
        quantity,
        locationNote,
      });
    } catch (err) {
      console.error("Failed to edit item", err);
    }
  };

  const handleDeleteItem = async (id: Id<"items">) => {
    const itemToDelete = items.find((i) => i._id === id);
    try {
      if (itemToDelete) {
        const restorable: RestorableItem = {
          routine: effectiveRoutine,
          name: itemToDelete.name,
          isPacked: itemToDelete.isPacked,
          emoji: itemToDelete.emoji,
          quantity: itemToDelete.quantity,
          locationNote: itemToDelete.locationNote,
          order: itemToDelete.order,
        };
        await deleteItem({ id });
        triggerUndo(`Deleted "${itemToDelete.name}"`, [restorable]);
      } else {
        await deleteItem({ id });
      }
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const handleMoveItem = async (id: Id<"items">, direction: -1 | 1) => {
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
      console.error("Failed to reorder items", err);
    }
  };

  const handleSaveSchedule = async (time?: string, days?: number[]) => {
    const target = scheduleTargetRoutine || currentRoutineObj;
    if (!target) return;
    try {
      await updateRoutine({
        id: target._id,
        name: target.name,
        icon: target.icon || "tag",
        autoResetTime: time,
        autoResetDays: days,
      });
    } catch (err) {
      console.error("Failed to update routine schedule", err);
    }
  };

  const handleSignOut = () => {
    setConfirmDialog({
      visible: true,
      title: "Sign Out",
      message: "Are you sure you want to log out of PocketChecker?",
      confirmText: "Log Out",
      cancelText: "Stay Signed In",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await signOut();
          router.replace("/(auth)/sign-in");
        } catch (err) {
          console.error("Sign out error", err);
        }
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.headerIconBox,
                { borderColor: colors.border, borderWidth: 1, overflow: "hidden" },
              ]}
            >
              <Image
                source={require("../../assets/images/icon.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              POCKET<Text style={{ color: colors.mutedForeground }}>CHECKER</Text>
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* Menu Trigger Button */}
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowMenuModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Open Menu"
            >
              <Ionicons
                name="menu-outline"
                size={24}
                color={colors.foreground}
              />
            </TouchableOpacity>

            {/* User Profile Avatar Button */}
            <TouchableOpacity
              style={styles.userAvatarBtn}
              onPress={() => setShowUserModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              {user?.imageUrl && !avatarError ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={[styles.headerAvatar, { borderColor: colors.border }]}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <View
                  style={[
                    styles.headerAvatarFallback,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.headerAvatarText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {(user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "U")[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Dashboard Body */}
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Card */}
          <ProgressCard
            totalItems={totalItems}
            packedItems={packedItems}
            theme={theme}
          />

          {/* Routine Switcher */}
          <RoutineSwitcher
            routines={routines}
            selectedRoutine={effectiveRoutine}
            onSelectRoutine={setSelectedRoutine}
            onOpenRoutineSettings={(routine) => setManageRoutine(routine)}
            onCreateRoutine={handleCreateRoutine}
            onOpenPresets={() => setShowPresetsModal(true)}
            theme={theme}
          />

          {/* Weather Intelligence Banner */}
          {effectiveRoutine ? (
            <WeatherBanner
              currentRoutineItems={items}
              onQuickAddItem={(name, emoji) => void handleAddItem(name, emoji)}
              theme={theme}
            />
          ) : null}

          {/* Smart Departure Intelligence Banner */}
          {effectiveRoutine && items.length > 0 ? (
            <SmartIntelligenceBanner
              routineName={effectiveRoutine}
              items={items}
              onQuickPack={async (id) => {
                await handleToggle(id, false);
              }}
              theme={theme}
            />
          ) : null}

          {/* Filter Tabs & Quick Actions */}
          <FilterTabs
            filter={filter}
            onFilterChange={setFilter}
            totalCount={totalItems}
            missingCount={missingItems}
            packedCount={packedItems}
            onResetAll={handleReset}
            onClearList={handleClearList}
            theme={theme}
          />

          {/* Checklist */}
          <View style={styles.checklistContainer}>
            {isRoutinesLoading || isItemsLoading ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Loading checklist...
                </Text>
              </View>
            ) : filteredItems.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="file-tray-outline"
                  size={32}
                  color={colors.mutedForeground}
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {filter === "all"
                    ? "No items added to this routine yet."
                    : filter === "packed"
                    ? "No items packed yet. Tap items to pack them!"
                    : "All items are packed! Great job!"}
                </Text>
                {filter === "all" && (
                  <TouchableOpacity
                    style={[styles.presetQuickBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
                    onPress={() => setShowPresetsModal(true)}
                  >
                    <Ionicons name="sparkles" size={14} color={colors.primaryForeground} />
                    <Text style={[styles.presetQuickBtnText, { color: colors.primaryForeground }]}>
                      Browse Smart Presets
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredItems.map((item) => (
                <ChecklistItem
                  key={item._id}
                  item={item}
                  onToggle={handleToggle}
                  onOpenSettings={(itemToEdit) => {
                    setManageItem(itemToEdit);
                    setEditItemIconKey(itemToEdit.emoji ?? "");
                  }}
                  theme={theme}
                />
              ))
            )}
          </View>

          {/* Add Item Form with Multi-Item Batch Support & Auto-Icon Detection */}
          {effectiveRoutine ? (
            <AddItemForm
              onAddItem={handleAddItem}
              onAddItemsBatch={handleAddItemsBatch}
              onOpenIconPicker={() => {
                setIconPickerTarget("newItem");
                setShowIconPicker(true);
              }}
              selectedIconKey={newItemIconKey}
              theme={theme}
            />
          ) : null}
        </ScrollView>

        {/* Modals */}
        <IconPickerModal
          visible={showIconPicker}
          onClose={() => setShowIconPicker(false)}
          selectedKey={
            iconPickerTarget === "newItem" ? newItemIconKey : editItemIconKey
          }
          onSelectIcon={(key) => {
            if (iconPickerTarget === "newItem") {
              setNewItemIconKey(key);
            } else {
              setEditItemIconKey(key);
            }
          }}
          theme={theme}
        />

        <RoutineSettingsModal
          visible={!!manageRoutine}
          onClose={() => setManageRoutine(null)}
          routine={manageRoutine}
          onSave={handleSaveRoutine}
          onDelete={handleDeleteRoutine}
          onMove={handleMoveRoutine}
          onOpenSchedule={(r) => {
            setScheduleTargetRoutine(r);
            setShowScheduleModal(true);
          }}
          isFirst={
            routines.findIndex((r) => r._id === manageRoutine?._id) <= 0
          }
          isLast={
            routines.findIndex((r) => r._id === manageRoutine?._id) >=
            routines.length - 1
          }
          theme={theme}
        />

        <ItemSettingsModal
          visible={!!manageItem}
          onClose={() => setManageItem(null)}
          item={manageItem}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
          onMove={handleMoveItem}
          onOpenIconPicker={() => {
            setIconPickerTarget("editItem");
            setShowIconPicker(true);
          }}
          selectedIconKey={editItemIconKey}
          isFirst={items.findIndex((i) => i._id === manageItem?._id) <= 0}
          isLast={
            items.findIndex((i) => i._id === manageItem?._id) >=
            items.length - 1
          }
          theme={theme}
        />

        <SmartPresetsModal
          visible={showPresetsModal}
          onClose={() => setShowPresetsModal(false)}
          currentRoutine={effectiveRoutine}
          onSelectPreset={handleSelectPreset}
          theme={theme}
        />

        <ExportModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
          routineName={effectiveRoutine}
          items={items}
          theme={theme}
        />

        <ShareRoutineModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          routineName={effectiveRoutine}
          routineIcon={currentRoutineObj?.icon || "tag"}
          items={items}
          theme={theme}
        />

        <ScheduleModal
          visible={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setScheduleTargetRoutine(null);
          }}
          routineName={scheduleTargetRoutine?.name || effectiveRoutine}
          initialTime={scheduleTargetRoutine?.autoResetTime || currentRoutineObj?.autoResetTime}
          initialDays={scheduleTargetRoutine?.autoResetDays || currentRoutineObj?.autoResetDays}
          onSaveSchedule={handleSaveSchedule}
          theme={theme}
        />

        <AboutModal
          visible={showAboutModal}
          onClose={() => setShowAboutModal(false)}
          theme={theme}
        />

        <MenuModal
          visible={showMenuModal}
          onClose={() => setShowMenuModal(false)}
          activeRoutineName={effectiveRoutine}
          onOpenExport={() => setShowExportModal(true)}
          onOpenShare={() => setShowShareModal(true)}
          onOpenSchedule={() => {
            if (currentRoutineObj) {
              setScheduleTargetRoutine(currentRoutineObj);
              setShowScheduleModal(true);
            }
          }}
          onOpenAbout={() => setShowAboutModal(true)}
          theme={theme}
        />

        <UserProfileModal
          visible={showUserModal}
          onClose={() => setShowUserModal(false)}
          user={user}
          onSignOut={handleSignOut}
          theme={theme}
        />

        {/* Global Custom Confirmation Modal */}
        {confirmDialog && (
          <ConfirmModal
            visible={confirmDialog.visible}
            onClose={() => setConfirmDialog(null)}
            onConfirm={() => {
              const action = confirmDialog.onConfirm;
              setConfirmDialog(null);
              action();
            }}
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText={confirmDialog.confirmText}
            cancelText={confirmDialog.cancelText}
            variant={confirmDialog.variant}
            theme={theme}
          />
        )}

        {/* Floating 5-Second Undo Toast */}
        {undoToast && (
          <UndoToast
            message={undoToast.message}
            onUndo={() => void handleExecuteUndo()}
            onDismiss={() => setUndoToast(null)}
            theme={theme}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    height: 60,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBtn: {
    padding: 4,
  },
  userAvatarBtn: {
    padding: 2,
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  headerAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontSize: 12,
    fontWeight: "900",
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  checklistContainer: {
    marginVertical: 4,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  presetQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  presetQuickBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
