import React, { useEffect, useRef } from "react";
import { Text, StyleSheet, TouchableOpacity, Animated } from "react-native";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  theme: "light" | "dark"; // kept for API compat but toast is dark by design
}

export function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

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
          transform: [{ translateY }] 
        }
      ]}
    >
      <Text style={styles.message} numberOfLines={1}>{message}</Text>
      <TouchableOpacity style={styles.undoButton} onPress={onUndo}>
        <Text style={styles.undoText}>Undo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 32,
    left: 20,
    right: 20,
    zIndex: 999,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
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
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
  },
  undoButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  undoText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
});
