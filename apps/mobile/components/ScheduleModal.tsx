import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export interface ScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  routineName: string;
  initialTime?: string;
  initialDays?: number[];
  onSaveSchedule: (time?: string, days?: number[]) => Promise<void>;
  theme: "light" | "dark";
}

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

export function ScheduleModal({
  visible,
  onClose,
  routineName,
  initialTime = "06:00",
  initialDays = [1, 2, 3, 4, 5],
  onSaveSchedule,
  theme,
}: ScheduleModalProps) {
  const colors = Colors[theme];
  const [enabled, setEnabled] = useState<boolean>(!!initialTime);
  const [time, setTime] = useState(initialTime || "06:00");
  const [activeDays, setActiveDays] = useState<number[]>(
    initialDays && initialDays.length > 0 ? initialDays : [1, 2, 3, 4, 5]
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setEnabled(!!initialTime);
      setTime(initialTime || "06:00");
      setActiveDays(initialDays && initialDays.length > 0 ? initialDays : [1, 2, 3, 4, 5]);
    }
  }, [visible, initialTime, initialDays]);

  const toggleDay = (dayValue: number) => {
    setActiveDays((prev) => {
      if (prev.includes(dayValue)) {
        if (prev.length <= 1) return prev; // Keep at least one day
        return prev.filter((d) => d !== dayValue);
      }
      return [...prev, dayValue].sort();
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!enabled) {
        await onSaveSchedule(undefined, undefined);
      } else {
        await onSaveSchedule(time, activeDays);
      }
      onClose();
    } catch (e) {
      console.error("Failed to save schedule", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeChange = (text: string) => {
    let formatted = text.replace(/[^0-9]/g, "");
    if (formatted.length > 2) {
      formatted = formatted.slice(0, 2) + ":" + formatted.slice(2, 4);
    }
    setTime(formatted);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Ionicons name="time-outline" size={20} color={colors.foreground} />
                  <Text style={[styles.title, { color: colors.foreground }]}>Auto-Reset Schedule</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                Automatically uncheck all packed items for &quot;{routineName}&quot; so you start fresh each day.
              </Text>

              <TouchableOpacity
                style={[
                  styles.toggleContainer,
                  {
                    backgroundColor: colors.background,
                    borderColor: enabled ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setEnabled(!enabled)}
                activeOpacity={0.7}
              >
                <View style={styles.toggleLeft}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: enabled ? colors.primary : colors.border,
                        backgroundColor: enabled ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    {enabled && <Ionicons name="checkmark-sharp" size={14} color={colors.primaryForeground} />}
                  </View>
                  <View>
                    <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                      Daily Auto-Reset
                    </Text>
                    <Text style={[styles.toggleSubtext, { color: colors.mutedForeground }]}>
                      {enabled ? "Enabled" : "Disabled"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {enabled && (
                <View style={styles.configContainer}>
                  {/* Time Setting */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                      RESET TIME (24-HOUR)
                    </Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          backgroundColor: colors.background,
                          color: colors.foreground,
                          borderColor: colors.border,
                        },
                      ]}
                      value={time}
                      onChangeText={handleTimeChange}
                      placeholder="06:00"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>

                  {/* Active Days */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                      ACTIVE DAYS
                    </Text>
                    <View style={styles.daysGrid}>
                      {DAYS.map((day) => {
                        const isActive = activeDays.includes(day.value);
                        return (
                          <TouchableOpacity
                            key={day.value}
                            style={[
                              styles.dayButton,
                              {
                                backgroundColor: isActive ? colors.primary : colors.background,
                                borderColor: isActive ? colors.primary : colors.border,
                              },
                            ]}
                            onPress={() => toggleDay(day.value)}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                { color: isActive ? colors.primaryForeground : colors.foreground },
                              ]}
                            >
                              {day.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={onClose}
                  disabled={isSaving}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Schedule</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default ScheduleModal;

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
    gap: 14,
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
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  toggleSubtext: {
    fontSize: 11,
    fontWeight: "500",
  },
  configContainer: {
    gap: 12,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    fontFamily: "monospace",
    fontWeight: "700",
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
  },
  dayButton: {
    flex: 1,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 11,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  saveBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
});
