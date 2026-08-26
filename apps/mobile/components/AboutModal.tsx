import React from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  theme: "light" | "dark";
}

export function AboutModal({ visible, onClose, theme }: AboutModalProps) {
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
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <View
                    style={[
                      styles.iconBadge,
                      { borderColor: colors.border },
                    ]}
                  >
                    <Image
                      source={require("../assets/images/icon.png")}
                      style={styles.iconImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={[styles.title, { color: colors.foreground }]}>
                    About PocketChecker
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.description, { color: colors.foreground }]}>
                PocketChecker is a minimal checklist tool designed to make sure
                you never forget your keys, wallet, phone, or essential items
                before stepping out for work, gym, or custom routines.
              </Text>

              <TouchableOpacity
                style={[
                  styles.githubBtn,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  Linking.openURL(
                    "https://github.com/YogaDharma21/pocket-check"
                  )
                }
              >
                <Ionicons
                  name="logo-github"
                  size={18}
                  color={colors.foreground}
                />
                <Text style={[styles.githubText, { color: colors.foreground }]}>
                  github.com/yogaDharma21/pocket-check
                </Text>
                <Ionicons
                  name="open-outline"
                  size={14}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  iconImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  description: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  githubBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  githubText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
