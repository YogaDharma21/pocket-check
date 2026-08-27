import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { Colors } from "../constants/theme";
import { WeatherData, fetchDailyWeather } from "../lib/weather";

const LOCATION_STORAGE_KEY = "pocket_check_user_location";

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
  const [hasLocation, setHasLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // On mount: check if location is already saved
  useEffect(() => {
    let isMounted = true;
    async function loadSavedLocation() {
      try {
        const stored = await SecureStore.getItemAsync(LOCATION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            typeof parsed.lat === "number" &&
            typeof parsed.lon === "number"
          ) {
            const data = await fetchDailyWeather(
              parsed.lat,
              parsed.lon,
              parsed.locationName
            );
            if (isMounted && data) {
              setWeather(data);
              setHasLocation(true);
            }
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
    void loadSavedLocation();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDetectLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(
          "Location permission denied. Please enable location access in settings."
        );
        setIsLocating(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      let locName = "Current Location";

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
            "Current Location";
        }
      } catch {
        // reverse geocode fallback
      }

      const data = await fetchDailyWeather(lat, lon, locName);
      if (data) {
        setWeather(data);
        setHasLocation(true);
        try {
          await SecureStore.setItemAsync(
            LOCATION_STORAGE_KEY,
            JSON.stringify({ lat, lon, locationName: locName })
          );
        } catch {
          // Ignore storage errors
        }
      }
    } catch {
      setLocationError("Unable to retrieve location. Please try again.");
    } finally {
      setIsLocating(false);
    }
  }, []);

  if (dismissed) return null;

  // Opt-in state when location is not set yet
  if (!hasLocation || !weather || !weather.suggestion) {
    return (
      <View
        style={[
          styles.banner,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Ionicons name="sparkles-outline" size={18} color={colors.foreground} />
          </View>

          <View style={styles.headerInfoCol}>
            <View style={styles.labelRow}>
              <Text
                style={[styles.headerLabel, { color: colors.mutedForeground }]}
              >
                WEATHER INTELLIGENCE
              </Text>
              <View
                style={[
                  styles.notSetBadge,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={10}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.notSetText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Location not set
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.descriptionText,
                { color: locationError ? colors.destructive : colors.mutedForeground },
              ]}
            >
              {locationError ||
                "Enable location to get live weather alerts and packing recommendations."}
            </Text>
          </View>
        </View>

        <View style={styles.optInActionRow}>
          <TouchableOpacity
            style={[
              styles.detectBtn,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
            onPress={handleDetectLocation}
            disabled={isLocating}
            activeOpacity={0.7}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.foreground} />
            ) : (
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.foreground}
              />
            )}
            <Text
              style={[styles.detectBtnText, { color: colors.foreground }]}
            >
              {isLocating ? "Detecting..." : "Detect location"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissTextBtn}
            onPress={() => setDismissed(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dismissText, { color: colors.mutedForeground }]}>
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top Header Row with Icon, Title, Location Pill & Dismiss */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Ionicons name={iconName} size={20} color={colors.foreground} />
        </View>

        <View style={styles.headerInfoCol}>
          <View style={styles.labelRow}>
            <Text
              style={[styles.headerLabel, { color: colors.mutedForeground }]}
            >
              WEATHER INTELLIGENCE
            </Text>

            {/* Clickable Location Badge */}
            <TouchableOpacity
              style={[
                styles.locationBadge,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
              onPress={handleDetectLocation}
              disabled={isLocating}
              activeOpacity={0.7}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Ionicons
                  name="location-sharp"
                  size={11}
                  color={colors.mutedForeground}
                />
              )}
              <Text
                style={[
                  styles.locationBadgeText,
                  { color: colors.foreground },
                ]}
                numberOfLines={1}
              >
                {isLocating
                  ? "Updating..."
                  : weather.locationName || "Current Location"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.weatherStats, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {`${weather.temperatureMax}°C / ${weather.precipitationProbability}% Rain`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => setDismissed(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Suggestion Text */}
      <Text style={[styles.suggestionText, { color: colors.foreground }]}>
        {weather.suggestion}
      </Text>

      {/* Action Row */}
      <View style={styles.actionRow}>
        {weather.suggestedItem && !isItemInList && (
          <TouchableOpacity
            style={[
              styles.addBtn,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
            onPress={() => {
              if (weather.suggestedItem) {
                onQuickAddItem(
                  weather.suggestedItem.name,
                  weather.suggestedItem.emoji
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={15} color={colors.foreground} />
            <Text style={[styles.addBtnText, { color: colors.foreground }]}>
              Add {weather.suggestedItem.name}
            </Text>
          </TouchableOpacity>
        )}

        {isItemInList && !isItemPacked && (
          <View
            style={[
              styles.notPackedBadge,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.notPackedText,
                { color: colors.mutedForeground },
              ]}
            >
              Not yet packed
            </Text>
          </View>
        )}

        {isItemInList && isItemPacked && (
          <View
            style={[
              styles.packedBadge,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Ionicons name="checkmark-sharp" size={12} color={colors.primary} />
            <Text style={[styles.packedText, { color: colors.foreground }]}>
              Packed
            </Text>
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
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfoCol: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 160,
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  notSetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  notSetText: {
    fontSize: 10,
    fontWeight: "600",
  },
  descriptionText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  weatherStats: {
    fontSize: 11,
    fontWeight: "600",
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 4,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    paddingHorizontal: 2,
  },
  optInActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 2,
  },
  detectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  detectBtnText: {
    fontSize: 11,
    fontWeight: "800",
  },
  dismissTextBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  notPackedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  notPackedText: {
    fontSize: 11,
    fontWeight: "800",
  },
  packedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  packedText: {
    fontSize: 11,
    fontWeight: "800",
  },
});

