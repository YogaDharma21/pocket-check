import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export type FilterType = "all" | "missing" | "packed";

interface FilterTabsProps {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  totalCount: number;
  missingCount: number;
  packedCount: number;
  onResetAll: () => void;
  onClearList: () => void;
  theme: "light" | "dark";
}

export function FilterTabs({
  filter,
  onFilterChange,
  totalCount,
  missingCount,
  packedCount,
  onResetAll,
  onClearList,
  theme,
}: FilterTabsProps) {
  const colors = Colors[theme];

  return (
    <View style={styles.container}>
      {/* Top Action Links */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onResetAll}
        >
          <Ionicons name="refresh" size={13} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            UNCHECK ALL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onClearList}
        >
          <Ionicons name="trash-outline" size={13} color={colors.destructive} />
          <Text style={[styles.actionText, { color: colors.destructive }]}>
            CLEAR LIST
          </Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Control */}
      <View
        style={[
          styles.segmentedContainer,
          { backgroundColor: colors.muted },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            filter === "all" && [
              styles.activeSegmentBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ],
          ]}
          onPress={() => onFilterChange("all")}
        >
          <Text
            style={[
              styles.segmentText,
              {
                color:
                  filter === "all"
                    ? colors.foreground
                    : colors.mutedForeground,
              },
            ]}
          >
            All
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.foreground }]}>
              {totalCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            filter === "missing" && [
              styles.activeSegmentBtn,
              { backgroundColor: colors.card, borderColor: colors.destructive },
            ],
          ]}
          onPress={() => onFilterChange("missing")}
        >
          <Text
            style={[
              styles.segmentText,
              {
                color:
                  filter === "missing"
                    ? colors.destructive
                    : colors.mutedForeground,
              },
            ]}
          >
            Missing
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.destructive },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: colors.destructiveForeground },
              ]}
            >
              {missingCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            filter === "packed" && [
              styles.activeSegmentBtn,
              { backgroundColor: colors.card, borderColor: colors.primary },
            ],
          ]}
          onPress={() => onFilterChange("packed")}
        >
          <Text
            style={[
              styles.segmentText,
              {
                color:
                  filter === "packed"
                    ? colors.primary
                    : colors.mutedForeground,
              },
            ]}
          >
            Packed
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: colors.primaryForeground },
              ]}
            >
              {packedCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  segmentedContainer: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  activeSegmentBtn: {
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "900",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
});
