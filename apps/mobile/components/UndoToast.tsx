import React, { useEffect, useRef } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useAnimatedValue,
} from "react-native";
import { Colors } from "@/constants/theme";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  theme?: "light" | "dark";
}

export function UndoToast({ message, onUndo, onDismiss, theme = "dark" }: UndoToastProps) {
  const colors = Colors[theme];
  const opacity = useAnimatedValue(0);
  const translateY = useAnimatedValue(20);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onDismissRef.current());
    }, 5000);

    return () => clearTimeout(timer);
  }, [opacity, translateY]);

  return (
    <Animated.View 
      style={[
        styles.toastContainer, 
        { 
          opacity, 
          transform: [{ translateY }],
          backgroundColor: colors.card,
          borderColor: colors.border,
        }
      ]}
    >
      <Text style={[styles.message, { color: colors.foreground }]} numberOfLines={1}>{message}</Text>
      <TouchableOpacity 
        style={[styles.undoButton, { backgroundColor: colors.primary }]} 
        onPress={onUndo}
      >
        <Text style={[styles.undoText, { color: colors.primaryForeground }]}>Undo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 999,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  message: {
    fontSize: 14,
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  undoText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
