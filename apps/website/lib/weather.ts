/**
 * Free weather client using Open-Meteo API (https://open-meteo.com/)
 * 100% Free, open-source, requires NO API key and NO credit card.
 */

export interface WeatherData {
  precipitationProbability: number
  temperatureMax: number
  temperatureMin: number
  weatherCode: number
  isRainExpected: boolean
  isHotDay: boolean
  isColdDay: boolean
  description: string
  suggestion: string | null
  suggestedItem: {
    name: string
    emoji: string
  } | null
}

export async function fetchDailyWeather(
  lat?: number,
  lon?: number
): Promise<WeatherData | null> {
  try {
    // Default fallback coordinates (approx. Jakarta / Central)
    const latitude = lat ?? -6.2088
    const longitude = lon ?? 106.8456

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`

    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    const daily = data.daily
    if (!daily || !daily.precipitation_probability_max) return null

    const precipitationProbability = daily.precipitation_probability_max[0] ?? 0
    const temperatureMax = Math.round(daily.temperature_2m_max[0] ?? 28)
    const temperatureMin = Math.round(daily.temperature_2m_min[0] ?? 22)
    const weatherCode = daily.weather_code[0] ?? 0

    const isRainExpected = precipitationProbability >= 40
    const isHotDay = temperatureMax >= 32
    const isColdDay = temperatureMax <= 15

    let description = "Clear & pleasant"
    let suggestion: string | null = null
    let suggestedItem: { name: string; emoji: string } | null = null

    if (isRainExpected) {
      description = `Rain expected (${precipitationProbability}%)`
      suggestion = `Rain predicted today (${precipitationProbability}%) — pack an umbrella or raincoat!`
      suggestedItem = { name: "Umbrella", emoji: "Umbrella" }
    } else if (isHotDay) {
      description = `Sunny & hot (${temperatureMax}°C)`
      suggestion = `High heat today (${temperatureMax}°C) — bring sunglasses & sunscreen!`
      suggestedItem = { name: "Sunglasses", emoji: "Glasses" }
    } else if (isColdDay) {
      description = `Chilly weather (${temperatureMax}°C)`
      suggestion = `Cold day (${temperatureMax}°C) — pack a warm jacket!`
      suggestedItem = { name: "Jacket", emoji: "Shirt" }
    }

    return {
      precipitationProbability,
      temperatureMax,
      temperatureMin,
      weatherCode,
      isRainExpected,
      isHotDay,
      isColdDay,
      description,
      suggestion,
      suggestedItem,
    }
  } catch {
    return null
  }
}
