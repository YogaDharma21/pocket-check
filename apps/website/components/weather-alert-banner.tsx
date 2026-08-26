"use client"

import * as React from "react"
import { CloudRain, Sun, Thermometer, Plus, Check, MapPin } from "lucide-react"
import { WeatherData, fetchDailyWeather, reverseGeocode } from "@/lib/weather"
import { Button } from "@/components/ui/button"

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
  const [dismissed, setDismissed] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true

    async function loadWeather() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            if (!isMounted) return
            const lat = position.coords.latitude
            const lon = position.coords.longitude
            const locName = await reverseGeocode(lat, lon)
            const data = await fetchDailyWeather(lat, lon, locName)
            if (isMounted) {
              setWeather(data)
              setLoading(false)
            }
          },
          async () => {
            if (!isMounted) return
            const data = await fetchDailyWeather(undefined, undefined, "Jakarta")
            if (isMounted) {
              setWeather(data)
              setLoading(false)
            }
          },
          { timeout: 5000 }
        )
      } else {
        const data = await fetchDailyWeather(undefined, undefined, "Jakarta")
        if (isMounted) {
          setWeather(data)
          setLoading(false)
        }
      }
    }

    void loadWeather()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading || !weather || !weather.suggestion || dismissed) {
    return null
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
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
                  <MapPin className="h-2.5 w-2.5 text-blue-400" />
                  {weather.locationName}
                </span>
              )}
              <span className="text-[10px] text-zinc-500">
                {weather.temperatureMax}°C / {weather.precipitationProbability}% Rain
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
              className="h-7 text-xs border-blue-800/60 bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 flex items-center gap-1.5"
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
            className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
