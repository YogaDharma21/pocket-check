import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    fullName?: string | null;
    firstName?: string | null;
    primaryEmailAddress?: { emailAddress: string } | null;
    imageUrl?: string | null;
  } | null | undefined;
  onSignOut: () => void;
  theme: "light" | "dark";
}

export function UserProfileModal({
  visible,
  onClose,
  user,
  onSignOut,
  theme,
}: UserProfileModalProps) {
  const colors = Colors[theme];
  const [avatarError, setAvatarError] = React.useState(false);

  const displayName =
    user?.fullName ||
    user?.firstName ||
    (user?.primaryEmailAddress?.emailAddress
      ? user.primaryEmailAddress.emailAddress.split("@")[0]
      : "PocketChecker User");

  const email = user?.primaryEmailAddress?.emailAddress || "";
  const avatarUrl = user?.imageUrl;

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
                styles.modalContent,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <Text style={[styles.title, { color: colors.foreground }]}>
                    Account Profile
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name="close"
                    size={22}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>

              {/* User Info Card */}
              <View
                style={[
                  styles.profileCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                {avatarUrl && !avatarError ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarLarge}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallbackLarge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarInitials,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      {initials || "U"}
                    </Text>
                  </View>
                )}

                <View style={styles.userInfoCol}>
                  <Text
                    style={[styles.userName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  {email ? (
                    <Text
                      style={[styles.userEmail, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {email}
                    </Text>
                  ) : null}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        borderColor: "rgba(16, 185, 129, 0.3)",
                      },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={12}
                      color="#10b981"
                    />
                    <Text style={styles.statusBadgeText}>Signed In</Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[
                    styles.signOutBtn,
                    {
                      backgroundColor: colors.destructive || "#ef4444",
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    onSignOut();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.signOutBtnText}>Log Out of PocketChecker</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default UserProfileModal;

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
    gap: 16,
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "rgba(120,120,120,0.3)",
  },
  avatarFallbackLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "900",
  },
  userInfoCol: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
  },
  userEmail: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10b981",
  },
  actionSection: {
    marginTop: 4,
  },
  signOutBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
