export interface Item {
  _id: string;
  userId: string;
  routine: string;
  name: string;
  isPacked: boolean;
  isDefault?: boolean;
  emoji?: string;
  quantity?: number;
  locationNote?: string;
  order?: number;
}

export interface Routine {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  autoResetTime?: string; // "HH:mm"
  autoResetDays?: number[]; // e.g. [1, 2, 3, 4, 5]
  lastResetDate?: string; // "YYYY-MM-DD"
  order?: number;
}

export interface DailyWeatherForecast {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
}

export interface WeatherSuggestion {
  message: string;
  suggestedItem: {
    name: string;
    emoji: string;
  };
  reason: "rain" | "heat" | "cold";
}

export interface PresetItem {
  name: string;
  emoji?: string;
  quantity?: number;
  locationNote?: string;
}

export interface PresetRoutine {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: PresetItem[];
}

export interface WeatherData {
  precipitationProbability: number;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  isRainExpected: boolean;
  isHotDay: boolean;
  isColdDay: boolean;
  description: string;
  suggestion: string | null;
  locationName?: string;
  suggestedItem: {
    name: string;
    emoji: string;
  } | null;
}
