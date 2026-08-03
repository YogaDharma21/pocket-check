import React from "react";
import { View, ActivityIndicator, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../constants/theme";

export default function OAuthCallbackScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
