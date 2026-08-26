import React from "react";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/theme";

export default function AuthLayout() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
      }}
    />
  );
}
