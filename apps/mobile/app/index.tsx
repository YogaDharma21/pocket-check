import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, useColorScheme } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  if (!isLoaded) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <Ionicons name="cube" size={56} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          LOADING POCKETCHECK...
        </Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
