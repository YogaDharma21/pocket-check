import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { Id } from "../convex/_generated/dataModel";
import { SMART_PRESETS } from "../lib/presets";
import { renderItemIconHelper } from "./IconPicker";

export interface SmartIntelligenceBannerProps {
  routineName: string;
  items: { _id: Id<"items">; name: string; isPacked: boolean; emoji?: string }[];
  onQuickPack: (id: Id<"items">) => Promise<void>;
  theme: "light" | "dark";
}

export function SmartIntelligenceBanner({
  routineName,
  items,
  onQuickPack,
  theme,
}: SmartIntelligenceBannerProps) {
  const colors = Colors[theme];
  const [collapsed, setCollapsed] = useState(false);
  const [packingId, setPackingId] = useState<string | null>(null);

  if (!routineName || items.length === 0) return null;

  // Find if current routine matches a known preset
  const matchingPreset = SMART_PRESETS.find(
    (p) => p.name.toLowerCase() === routineName.toLowerCase()
  );

  // Usual gear reference list
  const usualBringNames: string[] = matchingPreset
    ? matchingPreset.items.map((i) => i.name)
    : items.slice(0, 5).map((i) => i.name);

  const missingItems = items.filter((i) => !i.isPacked);
  const missingCount = missingItems.length;
  const isAllPacked = missingCount === 0;

  const handlePack = async (id: Id<"items">) => {
    setPackingId(id);
    try {
      await onQuickPack(id);
    } finally {
      setPackingId(null);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed(!collapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.sparkleBox, { backgroundColor: colors.muted }]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>
              PACKING INTELLIGENCE
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Before you leave for {routineName}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isAllPacked ? "#10b98120" : colors.muted,
                borderColor: isAllPacked ? "#10b98150" : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isAllPacked ? "#10b981" : colors.foreground },
              ]}
            >
              {isAllPacked ? "All Packed" : `${missingCount} Missing`}
            </Text>
          </View>
          <Ionicons
            name={collapsed ? "chevron-down" : "chevron-up"}
            size={18}
            color={colors.mutedForeground}
          />
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.content}>
          {/* Usually bring section */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            You usually bring:
          </Text>
          <View style={styles.chipContainer}>
            {usualBringNames.map((name, idx) => {
              const matchingItem = items.find(
                (i) => i.name.toLowerCase() === name.toLowerCase()
              );
              const isPacked = matchingItem?.isPacked ?? false;

              return (
                <View
                  key={idx}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isPacked ? colors.muted + "80" : colors.background,
                      borderColor: colors.border,
                      opacity: isPacked ? 0.6 : 1,
                    },
                  ]}
                >
                  {matchingItem &&
                    renderItemIconHelper(matchingItem.emoji, colors.foreground, 13)}
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: colors.foreground,
                        textDecorationLine: isPacked ? "line-through" : "none",
                      },
                    ]}
                  >
                    {name}
                  </Text>
                  {isPacked && (
                    <Ionicons name="checkmark-sharp" size={12} color={colors.primary} />
                  )}
                </View>
              );
            })}
          </View>

          {/* Missing items quick pack buttons or all packed message */}
          {isAllPacked ? (
            <View style={styles.allPacked}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.allPackedText}>
                Everything is packed and ready to go!
              </Text>
            </View>
          ) : (
            <View style={styles.missingSection}>
              <Text style={[styles.missingSectionTitle, { color: colors.foreground }]}>
                {missingCount === 1
                  ? `You haven't packed ${missingItems[0].name}:`
                  : `You haven't packed ${missingCount} items:`}
              </Text>
              <View style={styles.missingChipContainer}>
                {missingItems.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.quickPackBtn,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handlePack(item._id)}
                    disabled={packingId === item._id}
                    activeOpacity={0.7}
                  >
                    {renderItemIconHelper(item.emoji, colors.foreground, 14)}
                    <Text style={[styles.quickPackName, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.quickPackAction, { color: colors.primary }]}>
                      + Pack
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default SmartIntelligenceBanner;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginVertical: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sparkleBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  content: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(120,120,120,0.2)",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  allPacked: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  allPackedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10b981",
  },
  missingSection: {
    gap: 6,
  },
  missingSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  missingChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickPackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickPackName: {
    fontSize: 12,
    fontWeight: "700",
  },
  quickPackAction: {
    fontSize: 11,
    fontWeight: "800",
  },
});
