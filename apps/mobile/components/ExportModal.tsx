import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  routineName: string;
  items: {
    name: string;
    isPacked: boolean;
    emoji?: string;
    quantity?: number;
    locationNote?: string;
  }[];
  theme: "light" | "dark";
}

export function ExportModal({
  visible,
  onClose,
  routineName,
  items,
  theme,
}: ExportModalProps) {
  const colors = Colors[theme];
  const [format, setFormat] = useState<"markdown" | "json">("markdown");
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    const date = new Date().toLocaleDateString();
    let md = `# PocketChecker -- ${routineName} Checklist\n\n*Exported on ${date}*\n\n`;
    items.forEach((item) => {
      const checkbox = item.isPacked ? "[x]" : "[ ]";
      const quantity = item.quantity && item.quantity > 1 ? ` (${item.quantity}x)` : "";
      const note = item.locationNote ? ` -- *${item.locationNote}*` : "";
      md += `- ${checkbox} ${item.name}${quantity}${note}\n`;
    });
    return md;
  };

  const generateJSON = () => {
    const data = {
      routineName,
      exportedAt: new Date().toISOString(),
      items: items.map((i) => ({
        name: i.name,
        isPacked: i.isPacked,
        emoji: i.emoji,
        quantity: i.quantity,
        locationNote: i.locationNote,
      })),
    };
    return JSON.stringify(data, null, 2);
  };

  const content = format === "markdown" ? generateMarkdown() : generateJSON();

  const handleShare = async () => {
    try {
      await Share.share({
        message: content,
        title: `PocketChecker - ${routineName} Export`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
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
                  <Ionicons name="download-outline" size={20} color={colors.primary} />
                  <Text style={[styles.title, { color: colors.foreground }]}>Export & Backup</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {routineName} ({items.length} items)
              </Text>

              <View style={[styles.formatToggle, { backgroundColor: colors.muted }]}>
                <TouchableOpacity
                  style={[
                    styles.formatButton,
                    format === "markdown" && { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => setFormat("markdown")}
                >
                  <Text
                    style={[
                      styles.formatText,
                      { color: format === "markdown" ? colors.foreground : colors.mutedForeground },
                    ]}
                  >
                    Markdown
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.formatButton,
                    format === "json" && { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => setFormat("json")}
                >
                  <Text
                    style={[
                      styles.formatText,
                      { color: format === "json" ? colors.foreground : colors.mutedForeground },
                    ]}
                  >
                    JSON
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.previewContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ScrollView showsVerticalScrollIndicator={true}>
                  <Text style={[styles.previewText, { color: colors.foreground }]}>{content}</Text>
                </ScrollView>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.footerButton, { backgroundColor: colors.primary }]}
                  onPress={handleShare}
                >
                  <Ionicons name={copied ? "checkmark" : "share-outline"} size={18} color={colors.primaryForeground} />
                  <Text style={[styles.footerButtonText, { color: colors.primaryForeground }]}>
                    {copied ? "Shared / Copied" : "Share / Export"}
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

export default ExportModal;

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
    maxHeight: "80%",
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
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  formatToggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  formatText: {
    fontSize: 13,
    fontWeight: "800",
  },
  previewContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 180,
  },
  previewText: {
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 16,
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
