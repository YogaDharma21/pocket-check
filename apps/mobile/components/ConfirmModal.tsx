import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "primary";
  icon?: keyof typeof Ionicons.glyphMap;
  theme: "light" | "dark";
}

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  icon,
  theme,
}: ConfirmModalProps) {
  const colors = Colors[theme];

  const defaultIcon: keyof typeof Ionicons.glyphMap =
    icon ??
    (variant === "destructive"
      ? "trash-outline"
      : variant === "warning"
      ? "alert-circle-outline"
      : "help-circle-outline");

  const iconColor =
    variant === "destructive"
      ? "#ef4444"
      : variant === "warning"
      ? "#f59e0b"
      : colors.primary;

  const iconBg =
    variant === "destructive"
      ? "rgba(239, 68, 68, 0.12)"
      : variant === "warning"
      ? "rgba(245, 158, 11, 0.12)"
      : "rgba(59, 130, 246, 0.12)";

  const iconBorder =
    variant === "destructive"
      ? "rgba(239, 68, 68, 0.3)"
      : variant === "warning"
      ? "rgba(245, 158, 11, 0.3)"
      : "rgba(59, 130, 246, 0.3)";

  const confirmBg =
    variant === "destructive"
      ? "#ef4444"
      : variant === "warning"
      ? "#f59e0b"
      : colors.primary;

  const confirmTextColor =
    variant === "warning" ? "#000000" : "#ffffff";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
              {/* Header Icon + Title */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: iconBg,
                      borderColor: iconBorder,
                    },
                  ]}
                >
                  <Ionicons name={defaultIcon} size={22} color={iconColor} />
                </View>
                <View style={styles.titleCol}>
                  <Text
                    style={[styles.title, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                </View>
              </View>

              {/* Message */}
              <Text
                style={[styles.message, { color: colors.mutedForeground }]}
              >
                {message}
              </Text>

              {/* Actions Footer */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.cancelText, { color: colors.foreground }]}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: confirmBg,
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    onConfirm();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.confirmText,
                      { color: confirmTextColor },
                    ]}
                  >
                    {confirmText}
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

export default ConfirmModal;

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
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "800",
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
