import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  activeRoutineName?: string;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onOpenSchedule: () => void;
  onOpenAbout: () => void;
  theme: "light" | "dark";
}

export function MenuModal({
  visible,
  onClose,
  activeRoutineName,
  onOpenExport,
  onOpenShare,
  onOpenSchedule,
  onOpenAbout,
  theme,
}: MenuModalProps) {
  const colors = Colors[theme];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Menu
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close Menu"
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>

              {/* Active Destination Section */}
              {activeRoutineName ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      ACTIVE DESTINATION
                    </Text>
                    <View
                      style={[
                        styles.routineBadge,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.routineBadgeText,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {activeRoutineName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemGroup}>
                    {/* Export Checklist */}
                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        onOpenExport();
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: colors.muted,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="download-outline"
                          size={18}
                          color={colors.foreground}
                        />
                      </View>
                      <View style={styles.itemContent}>
                        <Text
                          style={[
                            styles.itemTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          Export Checklist
                        </Text>
                        <Text
                          style={[
                            styles.itemSubtitle,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          Download Markdown, JSON, or print PDF
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Share Routine */}
                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        onOpenShare();
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: colors.muted,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="share-social-outline"
                          size={18}
                          color={colors.foreground}
                        />
                      </View>
                      <View style={styles.itemContent}>
                        <Text
                          style={[
                            styles.itemTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          Share Routine
                        </Text>
                        <Text
                          style={[
                            styles.itemSubtitle,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          Create a 1-click shareable link
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Schedule Auto-Reset */}
                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        onOpenSchedule();
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: colors.muted,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color={colors.foreground}
                        />
                      </View>
                      <View style={styles.itemContent}>
                        <Text
                          style={[
                            styles.itemTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          Schedule Auto-Reset
                        </Text>
                        <Text
                          style={[
                            styles.itemSubtitle,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          Set automatic daily unchecking
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* Divider */}
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border },
                ]}
              />

              {/* General Section */}
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  GENERAL
                </Text>

                <View style={styles.itemGroup}>
                  {/* About PocketChecker */}
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      onClose();
                      onOpenAbout();
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor:
                            theme === "dark"
                              ? "rgba(255, 255, 255, 0.08)"
                              : "rgba(0, 0, 0, 0.05)",
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={colors.foreground}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text
                        style={[
                          styles.itemTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        About PocketChecker
                      </Text>
                      <Text
                        style={[
                          styles.itemSubtitle,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Version info and repository
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default MenuModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  routineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 160,
  },
  routineBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  itemGroup: {
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  itemSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  divider: {
    height: 1,
    width: "100%",
  },
});
