import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

interface ProgressCardProps {
  totalItems: number;
  packedItems: number;
  theme: "light" | "dark";
}

export function ProgressCard({
  totalItems,
  packedItems,
  theme,
}: ProgressCardProps) {
  const colors = Colors[theme];
  const percentage = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  let headline = "Let's double-check before you pack!";
  if (totalItems === 0) {
    headline = "Your pocket list is empty. Add items below!";
  } else if (packedItems === totalItems) {
    headline = "Excellent! You are 100% prepared to leave!";
  } else if (percentage >= 50) {
    headline = "Looking good! Keep grabbing those items!";
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="shield-checkmark"
            size={36}
            color={colors.primary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            {headline}
          </Text>

          {/* Custom Progress Bar */}
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: colors.muted },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${percentage}%`,
                },
              ]}
            />
          </View>

          <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
            {packedItems} of {totalItems} items safely pocketed
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginVertical: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  headline: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
    lineHeight: 22,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
