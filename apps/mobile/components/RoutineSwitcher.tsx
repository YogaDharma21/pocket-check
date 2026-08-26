import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { Id } from "../convex/_generated/dataModel";

export interface RoutineItem {
  _id: Id<"routines">;
  name: string;
  icon: string;
  order?: number;
  autoResetTime?: string;
  autoResetDays?: number[];
  lastResetDate?: string;
}

interface RoutineSwitcherProps {
  routines: RoutineItem[];
  selectedRoutine: string;
  onSelectRoutine: (name: string) => void;
  onOpenRoutineSettings: (routine: RoutineItem) => void;
  onCreateRoutine: (name: string, icon: string) => void;
  onOpenPresets?: () => void;
  theme: "light" | "dark";
}

export function renderRoutineIconHelper(
  iconStr: string,
  color = "#ffffff",
  size = 20
) {
  const normalized = (iconStr || "").toLowerCase().trim();
  if (normalized.includes("work") || normalized.includes("briefcase")) {
    return <Ionicons name="briefcase-outline" size={size} color={color} />;
  }
  if (
    normalized.includes("gym") ||
    normalized.includes("fitness") ||
    normalized.includes("workout")
  ) {
    return <Ionicons name="fitness-outline" size={size} color={color} />;
  }
  if (normalized.includes("home") || normalized.includes("house")) {
    return <Ionicons name="home-outline" size={size} color={color} />;
  }
  if (
    normalized.includes("travel") ||
    normalized.includes("trip") ||
    normalized.includes("compass")
  ) {
    return <Ionicons name="compass-outline" size={size} color={color} />;
  }
  if (
    normalized.includes("campus") ||
    normalized.includes("school") ||
    normalized.includes("college") ||
    normalized.includes("university") ||
    normalized.includes("graduat") ||
    normalized.includes("study")
  ) {
    return <Ionicons name="school-outline" size={size} color={color} />;
  }
  return <Ionicons name="location-outline" size={size} color={color} />;
}

export function RoutineSwitcher({
  routines,
  selectedRoutine,
  onSelectRoutine,
  onOpenRoutineSettings,
  onCreateRoutine,
  onOpenPresets,
  theme,
}: RoutineSwitcherProps) {
  const colors = Colors[theme];
  const [showInput, setShowInput] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");

  const handleAdd = () => {
    if (!newRoutineName.trim()) return;
    onCreateRoutine(newRoutineName.trim(), "tag");
    setNewRoutineName("");
    setShowInput(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        WHERE ARE WE HEADING TODAY?
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {routines.map((routine) => {
          const isActive = routine.name === selectedRoutine;
          return (
            <View key={routine._id} style={styles.buttonWrapper}>
              <TouchableOpacity
                style={[
                  styles.routineButton,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => onSelectRoutine(routine.name)}
              >
                {renderRoutineIconHelper(
                  routine.name,
                  isActive ? colors.primaryForeground : colors.primary,
                  22
                )}
                <Text
                  style={[
                    styles.routineText,
                    {
                      color: isActive
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {routine.name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gearBtn,
                  { backgroundColor: colors.muted },
                ]}
                onPress={() => onOpenRoutineSettings(routine)}
              >
                <Ionicons
                  name="settings-outline"
                  size={12}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          );
        })}

        {onOpenPresets && (
          <TouchableOpacity
            style={[
              styles.routineButton,
              styles.addButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={onOpenPresets}
          >
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.routineText, { color: colors.foreground }]}>
              Presets
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.routineButton,
            styles.addButton,
            {
              backgroundColor: showInput ? colors.muted : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setShowInput(!showInput)}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={[styles.routineText, { color: colors.foreground }]}>
            Custom
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {showInput && (
        <View
          style={[
            styles.inputCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="pricetag-outline"
            size={18}
            color={colors.mutedForeground}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Name your destination..."
            placeholderTextColor={colors.mutedForeground}
            value={newRoutineName}
            onChangeText={setNewRoutineName}
            onSubmitEditing={handleAdd}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.setButton, { backgroundColor: colors.primary }]}
            onPress={handleAdd}
          >
            <Text
              style={[
                styles.setButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              SET
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
  },
  buttonWrapper: {
    position: "relative",
  },
  routineButton: {
    minWidth: 100,
    height: 76,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addButton: {
    minWidth: 80,
  },
  routineText: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  gearBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  setButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  setButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
});
