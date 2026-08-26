import * as React from "react";
import { CloudRain, Sun, Thermometer, Plus, Check } from "lucide-react";
import { WeatherData, fetchDailyWeather } from "@/lib/weather";
import { Button } from "@/components/ui/button";
import { useDesktopNotifications } from "@/hooks/useDesktopNotifications";

interface WeatherAlertBannerProps {
  currentRoutineItems: Array<{ name: string; isPacked: boolean }>;
  onQuickAddItem: (name: string, emoji?: string) => void;
  onToggleItemPacked?: (name: string) => void;
}

export function WeatherAlertBanner({
  currentRoutineItems,
  onQuickAddItem,
}: WeatherAlertBannerProps) {
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [dismissed, setDismissed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const { sendNotification } = useDesktopNotifications();
  const notificationSentRef = React.useRef(false);

  React.useEffect(() => {
    let isMounted = true;

    const handleWeatherData = (data: WeatherData | null) => {
      if (!isMounted) return;
      setWeather(data);
      setLoading(false);

      if (data && data.suggestion && !notificationSentRef.current) {
        notificationSentRef.current = true;
        if (data.isRainExpected) {
          sendNotification("PocketCheck Weather Alert", data.suggestion, "Umbrella");
        } else if (data.isHotDay) {
          sendNotification("PocketCheck Weather Alert", data.suggestion, "Sun");
        } else if (data.isColdDay) {
          sendNotification("PocketCheck Weather Alert", data.suggestion, "Thermometer");
        }
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isMounted) return;
          const data = await fetchDailyWeather(
            position.coords.latitude,
            position.coords.longitude
          );
          handleWeatherData(data);
        },
        async () => {
          if (!isMounted) return;
          const data = await fetchDailyWeather();
          handleWeatherData(data);
        },
        { timeout: 5000 }
      );
    } else {
      fetchDailyWeather().then((data) => {
        handleWeatherData(data);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [sendNotification]);

  if (loading || !weather || !weather.suggestion || dismissed) {
    return null;
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

  return (
    <div className="relative overflow-hidden rounded-lg border border-blue-900/40 bg-gradient-to-r from-blue-950/30 via-card to-card p-3.5 shadow-xs backdrop-blur-xs">
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Weather Intelligence
              </span>
              <span className="text-[10px] text-muted-foreground">
                {weather.temperatureMax}°C / {weather.precipitationProbability}% Rain
              </span>
            </div>
            <p className="text-xs text-foreground/90 font-medium">{weather.suggestion}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {weather.suggestedItem && !isItemInList && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-blue-800/60 bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 flex items-center gap-1.5 cursor-pointer font-bold"
              onClick={() => {
                if (weather.suggestedItem) {
                  onQuickAddItem(
                    weather.suggestedItem.name,
                    weather.suggestedItem.emoji
                  );
                }
              }}
            >
              <Plus className="h-3 w-3" />
              Add {weather.suggestedItem.name}
            </Button>
          )}

          {isItemInList && !isItemPacked && (
            <span className="text-[11px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              Not yet packed
            </span>
          )}

          {isItemInList && isItemPacked && (
            <span className="text-[11px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/30 flex items-center gap-1">
              <Check className="h-3 w-3" /> Packed
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
  );
}
