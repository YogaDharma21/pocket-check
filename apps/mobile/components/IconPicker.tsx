import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export interface ItemIconDef {
  name: string;
  key: string;
  ionicon: keyof typeof Ionicons.glyphMap;
}

export const ITEM_ICONS: ItemIconDef[] = [
  { name: "Key", key: "key", ionicon: "key-outline" },
  { name: "Wallet", key: "wallet", ionicon: "wallet-outline" },
  { name: "Card", key: "card", ionicon: "card-outline" },
  { name: "Phone", key: "phone", ionicon: "phone-portrait-outline" },
  { name: "Laptop", key: "laptop", ionicon: "laptop-outline" },
  { name: "Headphones", key: "headphones", ionicon: "headset-outline" },
  { name: "Tablet", key: "tablet", ionicon: "tablet-portrait-outline" },
  { name: "Watch", key: "watch", ionicon: "watch-outline" },
  { name: "Camera", key: "camera", ionicon: "camera-outline" },
  { name: "Battery", key: "battery", ionicon: "battery-charging-outline" },
  { name: "Plug", key: "plug", ionicon: "hardware-chip-outline" },
  { name: "Backpack", key: "backpack", ionicon: "bag-handle-outline" },
  { name: "Briefcase", key: "briefcase", ionicon: "briefcase-outline" },
  { name: "Bag", key: "bag", ionicon: "bag-outline" },
  { name: "Luggage", key: "luggage", ionicon: "airplane-outline" },
  { name: "Umbrella", key: "umbrella", ionicon: "umbrella-outline" },
  { name: "Glasses", key: "glasses", ionicon: "glasses-outline" },
  { name: "Sun", key: "sun", ionicon: "sunny-outline" },
  { name: "Pill", key: "pill", ionicon: "medical-outline" },
  { name: "Heart", key: "heart", ionicon: "heart-outline" },
  { name: "Shield", key: "shield", ionicon: "shield-checkmark-outline" },
  { name: "Activity", key: "activity", ionicon: "fitness-outline" },
  { name: "File", key: "file", ionicon: "document-text-outline" },
  { name: "Book", key: "book", ionicon: "book-outline" },
  { name: "Coffee", key: "coffee", ionicon: "cafe-outline" },
  { name: "Utensils", key: "utensils", ionicon: "restaurant-outline" },
  { name: "Smile", key: "smile", ionicon: "happy-outline" },
  { name: "Star", key: "star", ionicon: "star-outline" },
  { name: "Tag", key: "tag", ionicon: "pricetag-outline" },
  { name: "Flame", key: "flame", ionicon: "flame-outline" },
  { name: "Zap", key: "zap", ionicon: "flash-outline" },
];

const ITEM_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> =
  ITEM_ICONS.reduce((acc, curr) => {
    acc[curr.key] = curr.ionicon;
    return acc;
  }, {} as Record<string, keyof typeof Ionicons.glyphMap>);

export function renderItemIconHelper(
  iconKey?: string,
  color = "#10b981",
  size = 18
) {
  if (!iconKey) return null;
  const key = iconKey.toLowerCase().trim();
  const ioniconName = ITEM_ICON_MAP[key];
  if (ioniconName) {
    return <Ionicons name={ioniconName} size={size} color={color} />;
  }
  // Check if emoji
  if (iconKey.match(/\p{Emoji}/u)) {
    return <Text style={{ fontSize: size }}>{iconKey}</Text>;
  }
  return <Ionicons name="pricetag-outline" size={size} color={color} />;
}

interface IconPickerProps {
  visible: boolean;
  onClose: () => void;
  selectedKey?: string;
  onSelectIcon: (key: string) => void;
  theme: "light" | "dark";
}

export function IconPickerModal({
  visible,
  onClose,
  selectedKey,
  onSelectIcon,
  theme,
}: IconPickerProps) {
  const colors = Colors[theme];
  const [search, setSearch] = useState("");

  const filtered = ITEM_ICONS.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="pricetag" size={18} color={colors.primary} />
              <Text style={[styles.title, { color: colors.foreground }]}>
                Select Item Icon
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="search"
              size={16}
              color={colors.mutedForeground}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search icons (e.g. key, phone, wallet)..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.grid}>
            <TouchableOpacity
              style={[
                styles.gridItem,
                {
                  borderColor: !selectedKey ? colors.primary : colors.border,
                  backgroundColor: !selectedKey
                    ? colors.muted
                    : colors.background,
                },
              ]}
              onPress={() => {
                onSelectIcon("");
                onClose();
              }}
            >
              <Ionicons
                name="close"
                size={20}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.iconLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                None
              </Text>
            </TouchableOpacity>

            {filtered.map((item) => {
              const isSelected = selectedKey?.toLowerCase() === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.gridItem,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected
                        ? colors.muted
                        : colors.background,
                    },
                  ]}
                  onPress={() => {
                    onSelectIcon(item.key);
                    onClose();
                  }}
                >
                  <Ionicons
                    name={item.ionicon}
                    size={22}
                    color={isSelected ? colors.primary : colors.foreground}
                  />
                  <Text
                    style={[
                      styles.iconLabel,
                      { color: isSelected ? colors.primary : colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "75%",
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 24,
  },
  gridItem: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
});
