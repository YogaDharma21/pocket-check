import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { renderItemIconHelper } from "./IconPicker";

interface AddItemFormProps {
  onAddItem: (name: string, iconKey?: string) => void;
  onOpenIconPicker: () => void;
  selectedIconKey?: string;
  theme: "light" | "dark";
}

export function AddItemForm({
  onAddItem,
  onOpenIconPicker,
  selectedIconKey,
  theme,
}: AddItemFormProps) {
  const colors = Colors[theme];
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAddItem(name.trim(), selectedIconKey);
    setName("");
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        ADD TARGET ITEM TO BRING:
      </Text>

      <View style={styles.formRow}>
        <TouchableOpacity
          style={[
            styles.iconBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={onOpenIconPicker}
        >
          {selectedIconKey ? (
            renderItemIconHelper(selectedIconKey, colors.primary, 20)
          ) : (
            <Ionicons
              name="pricetag-outline"
              size={20}
              color={colors.mutedForeground}
            />
          )}
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="e.g., Umbrella, Wallet, Keys..."
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleSubmit}
        />

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
        >
          <Text
            style={[
              styles.addBtnText,
              { color: colors.primaryForeground },
            ]}
          >
            ADD
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
  },
  description: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  addBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
