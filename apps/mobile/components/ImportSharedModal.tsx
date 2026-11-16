import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/theme"
import { renderItemIconHelper } from "./IconPicker"
import { renderRoutineIconHelper } from "./RoutineSwitcher"
import type { ImportRoutineData } from "../lib/import-routine"

export interface ImportSharedModalProps {
  visible: boolean
  onClose: () => void
  data: ImportRoutineData | null
  onConfirmImport: () => Promise<void>
  theme: "light" | "dark"
}

export function ImportSharedModal({
  visible,
  onClose,
  data,
  onConfirmImport,
  theme,
}: ImportSharedModalProps) {
  const colors = Colors[theme]
  const [importing, setImporting] = useState(false)

  if (!data) return null

  const handleImport = async () => {
    if (importing) return
    setImporting(true)
    try {
      await onConfirmImport()
      onClose()
    } catch (err) {
      console.error("Failed to import routine:", err)
    } finally {
      setImporting(false)
    }
  }

  const routineIcon = data.icon || "tag"
  const itemsCount = data.items.length

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
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(166, 176, 189, 0.12)"
                            : "rgba(92, 107, 122, 0.12)",
                      },
                    ]}
                  >
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color={colors.blue}
                    />
                  </View>
                  <Text style={[styles.title, { color: colors.foreground }]}>
                    Import Routine
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>

              {/* Routine Summary Card */}
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: colors.surfaceInset,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.previewHeader}>
                  <View
                    style={[
                      styles.routineIconBox,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {renderRoutineIconHelper(
                      routineIcon,
                      colors.foreground,
                      18
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.routineName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {data.name}
                    </Text>
                    <Text
                      style={[
                        styles.routineCount,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {itemsCount} {itemsCount === 1 ? "item" : "items"}
                    </Text>
                  </View>
                </View>

                {/* Items List */}
                <ScrollView
                  style={styles.itemsScroll}
                  contentContainerStyle={styles.itemsContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {data.items.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.itemRow,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <View style={styles.itemRowLeft}>
                        {renderItemIconHelper(
                          item.emoji,
                          colors.foreground,
                          14
                        )}
                        <Text
                          style={[
                            styles.itemName,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        {item.quantity && item.quantity > 1 ? (
                          <Text
                            style={[
                              styles.itemQuantity,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            ({item.quantity}x)
                          </Text>
                        ) : null}
                      </View>
                      {item.locationNote ? (
                        <Text
                          style={[
                            styles.itemNote,
                            { color: colors.mutedForeground },
                          ]}
                          numberOfLines={1}
                        >
                          {item.locationNote}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Footer Actions */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceInset,
                    },
                  ]}
                  onPress={onClose}
                  disabled={importing}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: colors.foreground },
                    ]}
                  >
                    Dismiss
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.importButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: importing ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleImport}
                  disabled={importing}
                >
                  {importing ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primaryForeground}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="download-outline"
                        size={16}
                        color={colors.primaryForeground}
                      />
                      <Text
                        style={[
                          styles.importButtonText,
                          { color: colors.primaryForeground },
                        ]}
                      >
                        Import Routine
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default ImportSharedModal

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routineIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  routineName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  routineCount: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  itemsScroll: {
    maxHeight: 180,
  },
  itemsContainer: {
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  itemRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: "500",
  },
  itemNote: {
    fontSize: 11,
    fontStyle: "italic",
    marginLeft: 8,
    maxWidth: 90,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  importButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
})
