import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Colors } from "../constants/theme";
import { WeatherData, fetchDailyWeather } from "../lib/weather";

export interface WeatherBannerProps {
  currentRoutineItems: { name: string; isPacked: boolean }[];
  onQuickAddItem: (name: string, emoji?: string) => void;
  theme: "light" | "dark";
}

export function WeatherBanner({
  currentRoutineItems,
  onQuickAddItem,
  theme,
}: WeatherBannerProps) {
  const colors = Colors[theme];
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      try {
        let lat: number | undefined;
        let lon: number | undefined;
        let locName: string | undefined;

        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;

            try {
              const geocoded = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lon,
              });
              if (geocoded && geocoded.length > 0) {
                const geo = geocoded[0];
                locName =
                  geo.city ||
                  geo.subregion ||
                  geo.district ||
                  geo.region ||
                  geo.name ||
                  undefined;
              }
            } catch {
              // reverse geocode optional fallback
            }
          }
        } catch (locErr) {
          console.warn("Location permission or acquisition not available, using default", locErr);
        }

        const data = await fetchDailyWeather(lat, lon, locName);
        if (isMounted) {
          setWeather(data);
        }
      } catch (e) {
        console.error("Failed to fetch weather", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    void loadWeather();
    return () => {
      isMounted = false;
    };
  }, []);

  if (dismissed || loading || !weather || !weather.suggestion) return null;

  const isItemInList = currentRoutineItems.some(
    (item) =>
      weather.suggestedItem &&
      item.name.toLowerCase().includes(weather.suggestedItem.name.toLowerCase())
  );

  const isItemPacked = currentRoutineItems.some(
    (item) =>
      weather.suggestedItem &&
      item.name.toLowerCase().includes(weather.suggestedItem.name.toLowerCase()) &&
      item.isPacked
  );

  const iconName: keyof typeof Ionicons.glyphMap = weather.isRainExpected
    ? "rainy-outline"
    : weather.isHotDay
    ? "sunny-outline"
    : "thermometer-outline";

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.card,
          borderColor: "rgba(59, 130, 246, 0.3)",
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Ionicons name={iconName} size={18} color="#3b82f6" />
          </View>
          <View style={styles.headerTextCol}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerLabel}>WEATHER INTELLIGENCE</Text>
              <Text style={[styles.weatherStats, { color: colors.mutedForeground }]}>
                {weather.locationName ? `${weather.locationName} \u2022 ` : ""}
                {weather.temperatureMax}\u00B0C / {weather.precipitationProbability}% Rain
              </Text>
            </View>
            <Text style={[styles.suggestionText, { color: colors.foreground }]}>
              {weather.suggestion}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => setDismissed(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        {weather.suggestedItem && !isItemInList && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (weather.suggestedItem) {
                onQuickAddItem(
                  weather.suggestedItem.name,
                  weather.suggestedItem.emoji
                );
              }
            }}
          >
            <Ionicons name="add" size={14} color="#3b82f6" />
            <Text style={styles.addBtnText}>
              Add {weather.suggestedItem.name}
            </Text>
          </TouchableOpacity>
        )}

        {isItemInList && !isItemPacked && (
          <View style={styles.notPackedBadge}>
            <Text style={styles.notPackedText}>Not yet packed</Text>
          </View>
        )}

        {isItemInList && isItemPacked && (
          <View style={styles.packedBadge}>
            <Ionicons name="checkmark-sharp" size={12} color="#10b981" />
            <Text style={styles.packedText}>Packed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default WeatherBanner;

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginVertical: 6,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#3b82f6",
  },
  weatherStats: {
    fontSize: 10,
    fontWeight: "600",
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  dismissBtn: {
    padding: 2,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.4)",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3b82f6",
  },
  notPackedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  notPackedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#f59e0b",
  },
  packedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  packedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
  },
});
