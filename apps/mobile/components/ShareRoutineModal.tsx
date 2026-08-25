import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { renderItemIconHelper } from "./IconPicker";
import { renderRoutineIconHelper } from "./RoutineSwitcher";

export interface ShareRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  routineName: string;
  routineIcon: string;
  items: {
    name: string;
    emoji?: string;
    quantity?: number;
    locationNote?: string;
  }[];
  theme: "light" | "dark";
}

export function ShareRoutineModal({
  visible,
  onClose,
  routineName,
  routineIcon,
  items,
  theme,
}: ShareRoutineModalProps) {
  const colors = Colors[theme];
  const [copied, setCopied] = useState(false);

  const generateShareUrl = () => {
    try {
      const payload = {
        name: routineName,
        icon: routineIcon,
        items: items.map((i) => ({
          name: i.name,
          emoji: i.emoji,
          quantity: i.quantity,
          locationNote: i.locationNote,
        })),
      };
      // Base64 encoding compatible with Hermes / React Native
      const jsonStr = JSON.stringify(payload);
      let encoded = "";
      try {
        encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      } catch {
        encoded = btoa(jsonStr);
      }
      return `https://pocketchecker.my.id?import=${encodeURIComponent(encoded)}`;
    } catch {
      return `https://pocketchecker.my.id`;
    }
  };

  const shareUrl = generateShareUrl();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my "${routineName}" packing checklist on PocketCheck: ${shareUrl}`,
        title: `PocketCheck - Share ${routineName}`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Ionicons name="share-social-outline" size={20} color={colors.primary} />
                  <Text style={[styles.title, { color: colors.foreground }]}>Share Routine</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                Anyone with this link can 1-click import this checklist into their PocketCheck account.
              </Text>

              <View style={[styles.previewCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <View style={styles.previewHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                    {renderRoutineIconHelper(routineIcon, colors.foreground, 18)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.previewName, { color: colors.foreground }]}>{routineName}</Text>
                    <Text style={[styles.previewCount, { color: colors.mutedForeground }]}>
                      {items.length} items included
                    </Text>
                  </View>
                </View>

                <View style={styles.chipContainer}>
                  {items.slice(0, 6).map((item, idx) => (
                    <View key={idx} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {renderItemIconHelper(item.emoji, colors.foreground, 12)}
                      <Text style={[styles.chipText, { color: colors.foreground }]} numberOfLines={1}>
                        {item.name}
                        {item.quantity && item.quantity > 1 ? ` (${item.quantity}x)` : ""}
                      </Text>
                    </View>
                  ))}
                  {items.length > 6 && (
                    <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
                      +{items.length - 6} more
                    </Text>
                  )}
                </View>
              </View>

              <View style={[styles.urlContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="link-outline" size={16} color={colors.mutedForeground} />
                <Text style={[styles.urlText, { color: colors.foreground }]} numberOfLines={1}>
                  {shareUrl}
                </Text>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.footerButton, { backgroundColor: colors.primary }]}
                  onPress={handleShare}
                >
                  <Ionicons name={copied ? "checkmark" : "share-outline"} size={18} color={colors.primaryForeground} />
                  <Text style={[styles.footerButtonText, { color: colors.primaryForeground }]}>
                    {copied ? "Shared Link" : "Share Link"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default ShareRoutineModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  description: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  previewName: {
    fontSize: 15,
    fontWeight: "800",
  },
  previewCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  moreText: {
    fontSize: 11,
    fontWeight: "700",
  },
  urlContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  urlText: {
    fontSize: 12,
    fontFamily: "monospace",
    flex: 1,
  },
  footer: {
    marginTop: 4,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
