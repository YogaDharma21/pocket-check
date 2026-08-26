"use client"

import * as React from "react"
import {
  CloudRain,
  Sun,
  Thermometer,
  Plus,
  Check,
  MapPin,
  Loader2,
  Sparkles,
} from "lucide-react"
import { WeatherData, fetchDailyWeather, reverseGeocode } from "@/lib/weather"
import { Button } from "@/components/ui/button"

const LOCATION_STORAGE_KEY = "pocket_check_user_location"

interface WeatherAlertBannerProps {
  currentRoutineItems: Array<{ name: string; isPacked: boolean }>
  onQuickAddItem: (name: string, emoji?: string) => void
  onToggleItemPacked?: (name: string) => void
}

export function WeatherAlertBanner({
  currentRoutineItems,
  onQuickAddItem,
}: WeatherAlertBannerProps) {
  const [weather, setWeather] = React.useState<WeatherData | null>(null)
  const [hasLocation, setHasLocation] = React.useState(false)
  const [isLocating, setIsLocating] = React.useState(false)
  const [locationError, setLocationError] = React.useState<string | null>(null)
  const [dismissed, setDismissed] = React.useState(false)

  // On mount: check if the user previously saved their location
  React.useEffect(() => {
    let isMounted = true

    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (
          typeof parsed.lat === "number" &&
          typeof parsed.lon === "number"
        ) {
          fetchDailyWeather(parsed.lat, parsed.lon, parsed.locationName).then(
            (data) => {
              if (isMounted && data) {
                setWeather(data)
                setHasLocation(true)
              }
            }
          )
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    return () => {
      isMounted = false
    }
  }, [])

  const handleDetectLocation = React.useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        const locName = (await reverseGeocode(lat, lon)) || "Current Location"
        const data = await fetchDailyWeather(lat, lon, locName)

        if (data) {
          setWeather(data)
          setHasLocation(true)
          try {
            localStorage.setItem(
              LOCATION_STORAGE_KEY,
              JSON.stringify({ lat, lon, locationName: locName })
            )
          } catch {
            // Ignore localStorage errors
          }
        }
        setIsLocating(false)
      },
      (err) => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please allow access in your browser.")
        } else {
          setLocationError("Unable to retrieve your location. Please try again.")
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }, [])

  if (dismissed) {
    return null
  }

  // If user hasn't set their location yet, show an opt-in prompt state
  if (!hasLocation || !weather || !weather.suggestion) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Sparkles className="h-4 w-4 text-foreground" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Weather Intelligence
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                  <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                  Location not set
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {locationError
                  ? locationError
                  : "Enable location to get live weather alerts and packing recommendations."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              disabled={isLocating}
              className="h-7 text-xs border-border bg-muted/40 hover:bg-muted text-foreground flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              onClick={handleDetectLocation}
            >
              {isLocating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MapPin className="h-3 w-3" />
              )}
              {isLocating ? "Detecting..." : "Detect location"}
            </Button>

            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isItemInList = currentRoutineItems.some(
    (item) =>
      weather.suggestedItem &&
      item.name.toLowerCase().includes(weather.suggestedItem.name.toLowerCase())
  )

  const isItemPacked = currentRoutineItems.some(
    (item) =>
      weather.suggestedItem &&
      item.name.toLowerCase().includes(weather.suggestedItem.name.toLowerCase()) &&
      item.isPacked
  )

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-3.5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            {weather.isRainExpected ? (
              <CloudRain className="h-4 w-4" />
            ) : weather.isHotDay ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Thermometer className="h-4 w-4" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Weather Intelligence
              </span>
              {weather.locationName && (
                <button
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  title="Click to refresh location"
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors px-1.5 py-0.5 rounded border border-border cursor-pointer"
                >
                  {isLocating ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                  ) : (
                    <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                  <span>{isLocating ? "Updating..." : weather.locationName}</span>
                </button>
              )}
              <span className="text-[10px] text-muted-foreground">
                • {weather.temperatureMax}°C / {weather.precipitationProbability}% Rain
              </span>
            </div>
            <p className="text-xs text-foreground font-medium">{weather.suggestion}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {weather.suggestedItem && !isItemInList && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-border bg-muted/40 hover:bg-muted text-foreground flex items-center gap-1.5 cursor-pointer font-bold"
              onClick={() => {
                if (weather.suggestedItem) {
                  onQuickAddItem(
                    weather.suggestedItem.name,
                    weather.suggestedItem.emoji
                  )
                }
              }}
            >
              <Plus className="h-3 w-3" />
              Add {weather.suggestedItem.name}
            </Button>
          )}

          {isItemInList && !isItemPacked && (
            <span className="text-[11px] text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded border border-border">
              Not yet packed
            </span>
          )}

          {isItemInList && isItemPacked && (
            <span className="text-[11px] text-foreground font-bold bg-muted px-2 py-0.5 rounded border border-border flex items-center gap-1">
              <Check className="h-3 w-3 text-primary stroke-[2.5]" /> Packed
            </span>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
