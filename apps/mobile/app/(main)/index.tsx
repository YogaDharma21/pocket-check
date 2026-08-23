import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
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
  const reorderItems = useMutation(api.pocketcheck.reorderItems);
  const reorderRoutines = useMutation(api.pocketcheck.reorderRoutines);

  const rawRoutines = useQuery(api.pocketcheck.listRoutines) ?? [];
  const routines: RoutineItem[] = rawRoutines.map((r) => ({
    _id: r._id,
    name: r.name,
    icon: r.icon,
    order: r.order,
  }));

  const activeRoutine = routines.find((r) => r.name === selectedRoutine);
  const effectiveRoutine = activeRoutine
    ? activeRoutine.name
    : routines.length > 0
    ? routines[0].name
    : "";

  const rawItems = useQuery(
    api.pocketcheck.listItems,
    effectiveRoutine ? { routine: effectiveRoutine } : "skip"
  ) ?? [];

  useEffect(() => {
    void ensureInitialized();
  }, [ensureInitialized]);

  const items: ItemData[] = rawItems.map((i) => ({
    _id: i._id,
    routine: i.routine,
    name: i.name,
    isPacked: i.isPacked,
    emoji: i.emoji,
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
    Alert.alert(
      "Clear All Items",
      `Are you sure you want to delete all items in "${effectiveRoutine}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAllItems({ routine: effectiveRoutine });
            } catch (err) {
              console.error("Failed to clear list", err);
            }
          },
        },
      ]
    );
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
      await updateRoutine({ id, name: newName, icon: routine.icon || "tag" });
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

  const handleSaveItem = async (
    id: Id<"items">,
    newName: string,
    iconKey?: string
  ) => {
    try {
      await editItemMutation({
        id,
        name: newName,
        emoji: iconKey || undefined,
      });
    } catch (err) {
      console.error("Failed to edit item", err);
    }
  };

  const handleDeleteItem = async (id: Id<"items">) => {
    try {
      await deleteItem({ id });
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

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of PocketCheck?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/sign-in");
          } catch (err) {
            console.error("Sign out error", err);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.container}>
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
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons
                name="cube"
                size={20}
                color={colors.primaryForeground}
              />
            </View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              POCKET<Text style={{ color: colors.mutedForeground }}>CHECK</Text>
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowAboutModal(true)}
            >
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={colors.foreground}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerBtn} onPress={handleSignOut}>
              <Ionicons
                name="log-out-outline"
                size={22}
                color={colors.mutedForeground}
              />
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
            theme={theme}
          />

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
            {filteredItems.length === 0 ? (
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

          {/* Add Item Form */}
          <AddItemForm
            onAddItem={handleAddItem}
            onOpenIconPicker={() => {
              setIconPickerTarget("newItem");
              setShowIconPicker(true);
            }}
            selectedIconKey={newItemIconKey}
            theme={theme}
          />
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

        <AboutModal
          visible={showAboutModal}
          onClose={() => setShowAboutModal(false)}
          theme={theme}
        />
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
});
