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
      <div className="relative overflow-hidden rounded-xl border border-blue-900/40 bg-gradient-to-r from-blue-950/30 via-zinc-900/80 to-zinc-900/80 p-3.5 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Weather Intelligence
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/40">
                  <MapPin className="h-2.5 w-2.5 text-zinc-400" />
                  Location not set
                </span>
              </div>
              <p className="text-xs text-zinc-300">
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
              className="h-7 text-xs border-blue-800/60 bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
              className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 cursor-pointer"
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
    <div className="relative overflow-hidden rounded-xl border border-blue-900/40 bg-gradient-to-r from-blue-950/30 via-zinc-900/80 to-zinc-900/80 p-3.5 shadow-sm backdrop-blur-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Weather Intelligence
              </span>
              {weather.locationName && (
                <button
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  title="Click to refresh location"
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 transition-colors px-1.5 py-0.5 rounded border border-blue-800/40 cursor-pointer"
                >
                  {isLocating ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-400" />
                  ) : (
                    <MapPin className="h-2.5 w-2.5 text-blue-400" />
                  )}
                  <span>{isLocating ? "Updating..." : weather.locationName}</span>
                </button>
              )}
              <span className="text-[10px] text-zinc-500">
                • {weather.temperatureMax}°C / {weather.precipitationProbability}% Rain
              </span>
            </div>
            <p className="text-xs text-zinc-300">{weather.suggestion}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {weather.suggestedItem && !isItemInList && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-blue-800/60 bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 flex items-center gap-1.5 cursor-pointer"
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
            <span className="text-[11px] text-amber-400 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              Not yet packed
            </span>
          )}

          {isItemInList && isItemPacked && (
            <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
              <Check className="h-3 w-3" /> Packed
            </span>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
