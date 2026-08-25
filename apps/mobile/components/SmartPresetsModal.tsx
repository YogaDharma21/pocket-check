import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { SMART_PRESETS, PresetRoutine } from "../lib/presets";
import { renderItemIconHelper } from "./IconPicker";
import { renderRoutineIconHelper } from "./RoutineSwitcher";

export interface SmartPresetsModalProps {
  visible: boolean;
  onClose: () => void;
  currentRoutine?: string;
  onSelectPreset: (preset: PresetRoutine, targetRoutine?: string) => Promise<void>;
  theme: "light" | "dark";
}

export function SmartPresetsModal({
  visible,
  onClose,
  currentRoutine,
  onSelectPreset,
  theme,
}: SmartPresetsModalProps) {
  const colors = Colors[theme];
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  const handleApply = async (preset: PresetRoutine, targetRoutine?: string) => {
    try {
      setLoadingPreset(`${preset.id}-${targetRoutine || "new"}`);
      await onSelectPreset(preset, targetRoutine);
      onClose();
    } catch (e) {
      console.error("Failed to apply preset", e);
    } finally {
      setLoadingPreset(null);
    }
  };

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
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <Ionicons name="sparkles" size={20} color={colors.primary} />
                  <Text style={[styles.title, { color: colors.foreground }]}>Smart Presets</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                Quickly start or populate your checklist with curated everyday essentials.
              </Text>

              <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {SMART_PRESETS.map((preset) => {
                  const isApplyingDirect = loadingPreset === `${preset.id}-new`;
                  const isApplyingToCurrent = loadingPreset === `${preset.id}-${currentRoutine}`;

                  return (
                    <View key={preset.id} style={[styles.presetCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <View style={styles.presetHeader}>
                        <View style={styles.presetTitleRow}>
                          <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
                            {renderRoutineIconHelper(preset.icon, colors.foreground, 20)}
                          </View>
                          <Text style={[styles.presetName, { color: colors.foreground }]}>{preset.name}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                          <Text style={[styles.badgeText, { color: colors.foreground }]}>{preset.items.length} items</Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.presetDescription, { color: colors.mutedForeground }]}>{preset.description}</Text>

                      <View style={styles.chipContainer}>
                        {preset.items.map((item, idx) => (
                          <View key={idx} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            {renderItemIconHelper(item.emoji, colors.foreground, 14)}
                            <Text style={[styles.chipText, { color: colors.foreground }]}>{item.name}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleApply(preset)}
                          disabled={loadingPreset !== null}
                        >
                          {isApplyingDirect ? (
                            <ActivityIndicator size="small" color={colors.primaryForeground} />
                          ) : (
                            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Open {preset.name}</Text>
                          )}
                        </TouchableOpacity>

                        {currentRoutine && currentRoutine.toLowerCase() !== preset.name.toLowerCase() && (
                          <TouchableOpacity
                            style={[styles.ghostButton, { borderColor: colors.border }]}
                            onPress={() => handleApply(preset, currentRoutine)}
                            disabled={loadingPreset !== null}
                          >
                            {isApplyingToCurrent ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Text style={[styles.ghostButtonText, { color: colors.foreground }]}>Add to {currentRoutine}</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default SmartPresetsModal;

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
    maxHeight: "85%",
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleRow: {
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
    marginBottom: 4,
  },
  closeButton: {
    padding: 4,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 8,
  },
  presetCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  presetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  presetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  presetName: {
    fontSize: 16,
    fontWeight: "800",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  presetDescription: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  ghostButton: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
