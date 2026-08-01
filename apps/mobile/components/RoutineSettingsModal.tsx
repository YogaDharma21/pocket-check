import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { RoutineItem } from "./RoutineSwitcher";

interface RoutineSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  routine: RoutineItem | null;
  onSave: (id: RoutineItem["_id"], newName: string) => void;
  onDelete: (id: RoutineItem["_id"]) => void;
  onMove: (id: RoutineItem["_id"], direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
  theme: "light" | "dark";
}

export function RoutineSettingsModal({
  visible,
  onClose,
  routine,
  onSave,
  onDelete,
  onMove,
  isFirst,
  isLast,
  theme,
}: RoutineSettingsModalProps) {
  const colors = Colors[theme];
  const [name, setName] = useState("");

  useEffect(() => {
    if (routine) {
      setName(routine.name);
    }
  }, [routine]);

  if (!routine) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(routine._id, name.trim());
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Destination",
      `Are you sure you want to delete "${routine.name}" and all its items?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onDelete(routine._id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Destination Settings
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              DESTINATION NAME
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
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              CHANGE ORDER
            </Text>
            <View style={styles.reorderRow}>
              <TouchableOpacity
                style={[
                  styles.reorderBtn,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    opacity: isFirst ? 0.4 : 1,
                  },
                ]}
                disabled={isFirst}
                onPress={() => onMove(routine._id, -1)}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={colors.foreground}
                />
                <Text style={[styles.btnText, { color: colors.foreground }]}>
                  Move Left
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.reorderBtn,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    opacity: isLast ? 0.4 : 1,
                  },
                ]}
                disabled={isLast}
                onPress={() => onMove(routine._id, 1)}
              >
                <Text style={[styles.btnText, { color: colors.foreground }]}>
                  Move Right
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.foreground}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text
              style={[
                styles.saveBtnText,
                { color: colors.primaryForeground },
              ]}
            >
              SAVE CHANGES
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteBtn,
              { backgroundColor: colors.destructive + "20" },
            ]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={16} color={colors.destructive} />
            <Text
              style={[styles.deleteBtnText, { color: colors.destructive }]}
            >
              DELETE DESTINATION
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  input: {
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
