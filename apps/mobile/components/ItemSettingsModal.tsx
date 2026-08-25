import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { ItemData } from "./ChecklistItem";
import { renderItemIconHelper } from "./IconPicker";
import { ConfirmModal } from "./ConfirmModal";

interface ItemSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  item: ItemData | null;
  onSave: (id: ItemData["_id"], newName: string, iconKey?: string, quantity?: number, locationNote?: string) => void;
  onDelete: (id: ItemData["_id"]) => void;
  onMove: (id: ItemData["_id"], direction: -1 | 1) => void;
  onOpenIconPicker: () => void;
  selectedIconKey?: string;
  isFirst: boolean;
  isLast: boolean;
  theme: "light" | "dark";
}

export function ItemSettingsModal({
  visible,
  onClose,
  item,
  onSave,
  onDelete,
  onMove,
  onOpenIconPicker,
  selectedIconKey,
  isFirst,
  isLast,
  theme,
}: ItemSettingsModalProps) {
  const colors = Colors[theme];
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [locationNote, setLocationNote] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity && item.quantity > 1 ? String(item.quantity) : "");
      setLocationNote(item.locationNote ?? "");
    }
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    const qty = parseInt(quantity, 10);
    onSave(
      item._id,
      name.trim(),
      selectedIconKey,
      isNaN(qty) || qty < 1 ? undefined : qty,
      locationNote.trim() || undefined
    );
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible && !showDeleteConfirm}
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
                  <Text style={[styles.title, { color: colors.foreground }]}>
                    Item Settings
                  </Text>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>
                </View>

                {/* Name + Icon Field */}
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    ITEM NAME & ICON
                  </Text>
                  <View style={styles.inputRow}>
                    <TouchableOpacity
                      style={[
                        styles.iconBtn,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={onOpenIconPicker}
                    >
                      {renderItemIconHelper(
                        selectedIconKey || item.emoji || "cube-outline",
                        colors.foreground,
                        22
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
                      value={name}
                      onChangeText={setName}
                      placeholder="Item name..."
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                </View>

                {/* Quantity + Location Note Fields */}
                <View style={styles.inputRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>
                      QUANTITY
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="1"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={[styles.field, { flex: 2 }]}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>
                      LOCATION NOTE
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      value={locationNote}
                      onChangeText={setLocationNote}
                      placeholder="e.g. Front pocket"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                </View>

                {/* Reorder Buttons */}
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    REORDER
                  </Text>
                  <View style={styles.reorderRow}>
                    <TouchableOpacity
                      style={[
                        styles.reorderBtn,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          opacity: isFirst ? 0.3 : 1,
                        },
                      ]}
                      onPress={() => onMove(item._id, -1)}
                      disabled={isFirst}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={16}
                        color={colors.foreground}
                      />
                      <Text
                        style={[styles.btnText, { color: colors.foreground }]}
                      >
                        Move Up
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.reorderBtn,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          opacity: isLast ? 0.3 : 1,
                        },
                      ]}
                      onPress={() => onMove(item._id, 1)}
                      disabled={isLast}
                    >
                      <Text
                        style={[styles.btnText, { color: colors.foreground }]}
                      >
                        Move Down
                      </Text>
                      <Ionicons
                        name="arrow-down"
                        size={16}
                        color={colors.foreground}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSave}
                >
                  <Text
                    style={[
                      styles.saveBtnText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Save Changes
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  style={[
                    styles.deleteBtn,
                    { backgroundColor: colors.destructive },
                  ]}
                  onPress={() => setShowDeleteConfirm(true)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.destructiveForeground}
                  />
                  <Text
                    style={[
                      styles.deleteBtnText,
                      { color: colors.destructiveForeground },
                    ]}
                  >
                    Delete Item
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(item._id);
          onClose();
        }}
        title="Delete Item"
        message={`Are you sure you want to delete "${item.name}" from your packing checklist?`}
        confirmText="Delete Item"
        cancelText="Keep Item"
        variant="destructive"
        theme={theme}
      />
    </>
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
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
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
  reorderRow: {
    flexDirection: "row",
    gap: 10,
  },
  reorderBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  saveBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  deleteBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
