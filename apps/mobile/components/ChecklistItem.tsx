import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { renderItemIconHelper } from "./IconPicker";
import { Id } from "../convex/_generated/dataModel";

export interface ItemData {
  _id: Id<"items">;
  routine: string;
  name: string;
  isPacked: boolean;
  emoji?: string;
  order?: number;
}

interface ChecklistItemProps {
  item: ItemData;
  onToggle: (id: Id<"items">, currentPacked: boolean) => void;
  onOpenSettings: (item: ItemData) => void;
  theme: "light" | "dark";
}

export function ChecklistItem({
  item,
  onToggle,
  onOpenSettings,
  theme,
}: ChecklistItemProps) {
  const colors = Colors[theme];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: item.isPacked
            ? colors.muted + "60"
            : colors.card,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.8}
      onPress={() => onToggle(item._id, item.isPacked)}
    >
      <View style={styles.leftSection}>
        {/* Checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              backgroundColor: item.isPacked
                ? colors.primary
                : colors.background,
              borderColor: item.isPacked ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onToggle(item._id, item.isPacked)}
        >
          {item.isPacked && (
            <Ionicons
              name="checkmark-sharp"
              size={18}
              color={colors.primaryForeground}
            />
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            {renderItemIconHelper(
              item.emoji,
              item.isPacked ? colors.mutedForeground : colors.primary,
              18
            )}
            <Text
              style={[
                styles.itemName,
                {
                  color: item.isPacked
                    ? colors.mutedForeground
                    : colors.foreground,
                  textDecorationLine: item.isPacked ? "line-through" : "none",
                },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: item.isPacked
                  ? colors.primary
                  : colors.muted,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: item.isPacked
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              {item.isPacked ? "Packed" : "Missing"}
            </Text>
          </View>
        </View>
      </View>

      {/* Control Gear Button */}
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => onOpenSettings(item)}
      >
        <Ionicons
          name="settings-outline"
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  settingsBtn: {
    padding: 6,
  },
});
