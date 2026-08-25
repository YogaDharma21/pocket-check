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
import { RoutineItem } from "./RoutineSwitcher";
import { ConfirmModal } from "./ConfirmModal";

interface RoutineSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  routine: RoutineItem | null;
  onSave: (id: RoutineItem["_id"], newName: string) => void;
  onDelete: (id: RoutineItem["_id"]) => void;
  onMove: (id: RoutineItem["_id"], direction: -1 | 1) => void;
  onOpenSchedule?: (routine: RoutineItem) => void;
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
  onOpenSchedule,
  isFirst,
  isLast,
  theme,
}: RoutineSettingsModalProps) {
  const colors = Colors[theme];
  const [name, setName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
                    Destination Settings
                  </Text>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>
                </View>

                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.label, { color: colors.mutedForeground }]}
                  >
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
                    placeholder="e.g. Work, Gym, Travel"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>

                {/* Move Order */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.label, { color: colors.mutedForeground }]}
                  >
                    REORDER TAB
                  </Text>
                  <View style={styles.moveRow}>
                    <TouchableOpacity
                      style={[
                        styles.moveBtn,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          opacity: isFirst ? 0.3 : 1,
                        },
                      ]}
                      onPress={() => onMove(routine._id, -1)}
                      disabled={isFirst}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={16}
                        color={colors.foreground}
                      />
                      <Text
                        style={[
                          styles.moveBtnText,
                          { color: colors.foreground },
                        ]}
                      >
                        Move Left
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.moveBtn,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          opacity: isLast ? 0.3 : 1,
                        },
                      ]}
                      onPress={() => onMove(routine._id, 1)}
                      disabled={isLast}
                    >
                      <Text
                        style={[
                          styles.moveBtnText,
                          { color: colors.foreground },
                        ]}
                      >
                        Move Right
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={colors.foreground}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Auto-Reset Schedule */}
                {onOpenSchedule && (
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.label, { color: colors.mutedForeground }]}
                    >
                      AUTOMATION
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.scheduleBtn,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        onOpenSchedule(routine);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="alarm-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[
                            styles.scheduleBtnTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          Auto-Reset Schedule
                        </Text>
                        <Text
                          style={[
                            styles.scheduleBtnSubtitle,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {routine.autoResetTime
                            ? `Resets at ${routine.autoResetTime} on active days`
                            : "Configure daily reset time & days"}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  </View>
                )}

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
                    Delete Destination
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
          onDelete(routine._id);
          onClose();
        }}
        title="Delete Destination"
        message={`Are you sure you want to delete "${routine.name}" and all of its checklist items? This action cannot be undone.`}
        confirmText="Delete Destination"
        cancelText="Keep Destination"
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
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "700",
  },
  moveRow: {
    flexDirection: "row",
    gap: 10,
  },
  moveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  moveBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  scheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  scheduleBtnTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  scheduleBtnSubtitle: {
    fontSize: 11,
    fontWeight: "600",
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
