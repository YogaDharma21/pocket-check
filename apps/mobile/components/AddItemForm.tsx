import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { renderItemIconHelper } from "./IconPicker";
import { parseMultiItemInput, detectIconForItem } from "../lib/presets";

interface AddItemFormProps {
  onAddItem: (name: string, iconKey?: string) => void;
  onAddItemsBatch: (items: { name: string; emoji?: string }[]) => void;
  onOpenIconPicker: () => void;
  selectedIconKey?: string;
  theme: "light" | "dark";
}

export function AddItemForm({
  onAddItem,
  onAddItemsBatch,
  onOpenIconPicker,
  selectedIconKey,
  theme,
}: AddItemFormProps) {
  const colors = Colors[theme];
  const [name, setName] = useState("");

  // Live auto-icon detection while typing
  const liveDetectedIcon = useMemo(() => {
    if (selectedIconKey) return selectedIconKey;
    const trimmed = name.trim();
    if (!trimmed) return null;
    const detected = detectIconForItem(trimmed);
    return detected !== "Tag" ? detected : null;
  }, [name, selectedIconKey]);

  // Parse multi-item input
  const parsedItems = useMemo(() => {
    return parseMultiItemInput(name, selectedIconKey);
  }, [name, selectedIconKey]);

  const isMultiItem = parsedItems.length > 1;

  const handleSubmit = () => {
    if (!name.trim()) return;

    if (isMultiItem) {
      onAddItemsBatch(parsedItems);
    } else {
      const detectedEmoji =
        selectedIconKey || detectIconForItem(name.trim());
      onAddItem(name.trim(), detectedEmoji !== "Tag" ? detectedEmoji : selectedIconKey);
    }
    setName("");
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        ADD TARGET ITEM TO BRING:
      </Text>

      <View style={styles.formRow}>
        <TouchableOpacity
          style={[
            styles.iconBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={onOpenIconPicker}
        >
          {liveDetectedIcon ? (
            renderItemIconHelper(liveDetectedIcon, colors.primary, 20)
          ) : selectedIconKey ? (
            renderItemIconHelper(selectedIconKey, colors.primary, 20)
          ) : (
            <Ionicons
              name="pricetag-outline"
              size={20}
              color={colors.mutedForeground}
            />
          )}
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="e.g., Umbrella, Wallet, Keys..."
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleSubmit}
        />

        <TouchableOpacity
          style={[
            styles.addBtn,
            {
              backgroundColor: colors.primary,
              opacity: name.trim() ? 1 : 0.5,
            },
          ]}
          onPress={handleSubmit}
          disabled={!name.trim()}
        >
          <Text
            style={[
              styles.addBtnText,
              { color: colors.primaryForeground },
            ]}
          >
            {isMultiItem ? `ADD ${parsedItems.length}` : "ADD"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Multi-item preview chips */}
      {isMultiItem && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewRow}
          contentContainerStyle={styles.previewContent}
        >
          <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
            Adding {parsedItems.length} items:
          </Text>
          {parsedItems.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.previewChip,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                },
              ]}
            >
              {renderItemIconHelper(item.emoji || "Tag", colors.foreground, 14)}
              <Text
                style={[styles.previewChipText, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tip text */}
      {!isMultiItem && (
        <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
          Tip: Type comma-separated items to bulk-add
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
  },
  description: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  addBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  previewRow: {
    marginTop: 10,
    maxHeight: 36,
  },
  previewContent: {
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginRight: 4,
  },
  previewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tipText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },
});
