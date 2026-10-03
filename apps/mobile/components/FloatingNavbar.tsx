import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

interface FloatingNavbarProps {
  theme: "light" | "dark";
  hasRoutine: boolean;
  onHome: () => void;
  onPresets: () => void;
  onExport: () => void;
  onShare: () => void;
  onSchedule: () => void;
  onAbout: () => void;
}

export function FloatingNavbar({
  theme,
  hasRoutine,
  onHome,
  onPresets,
  onExport,
  onShare,
  onSchedule,
  onAbout,
}: FloatingNavbarProps) {
  const colors = Colors[theme];

  const items: Array<{
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    disabled?: boolean;
    accessibilityLabel: string;
  }> = [
    {
      key: "home",
      label: "Home",
      icon: "home-outline",
      onPress: onHome,
      accessibilityLabel: "Back to checklist top",
    },
    {
      key: "presets",
      label: "Presets",
      icon: "sparkles-outline",
      onPress: onPresets,
      accessibilityLabel: "Browse smart presets",
    },
    {
      key: "export",
      label: "Export",
      icon: "download-outline",
      onPress: onExport,
      disabled: !hasRoutine,
      accessibilityLabel: "Export checklist",
    },
    {
      key: "share",
      label: "Share",
      icon: "share-social-outline",
      onPress: onShare,
      disabled: !hasRoutine,
      accessibilityLabel: "Share routine",
    },
    {
      key: "schedule",
      label: "Plan",
      icon: "time-outline",
      onPress: onSchedule,
      disabled: !hasRoutine,
      accessibilityLabel: "Schedule auto-reset",
    },
    {
      key: "about",
      label: "About",
      icon: "information-circle-outline",
      onPress: onAbout,
      accessibilityLabel: "About PocketChecker",
    },
  ];

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.navbar,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {items.map((item, index) => {
        const disabled = item.disabled === true;
        return (
          <React.Fragment key={item.key}>
            {(item.key === "export" || item.key === "about") && (
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            )}
            <TouchableOpacity
              style={styles.navItem}
              onPress={item.onPress}
              disabled={disabled}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={item.accessibilityLabel}
              accessibilityRole="tab"
              accessibilityState={{ disabled, selected: false }}
              activeOpacity={0.6}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={disabled ? colors.mutedForeground : colors.foreground}
                style={disabled ? styles.disabledIcon : undefined}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: disabled ? colors.mutedForeground : colors.foreground },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
            {index < items.length - 1 && <View style={styles.spacer} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 50,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 4,
    minHeight: 48,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  divider: {
    width: 1,
    height: 24,
    opacity: 0.8,
  },
  spacer: {
    width: 2,
  },
  disabledIcon: {
    opacity: 0.4,
  },
});
