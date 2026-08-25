import { describe, it } from "node:test";
import assert from "node:assert/strict";

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
  suggestedItem: {
    name: string;
    emoji: string;
  } | null;
}

export function evaluateWeatherData(daily: {
  precipitation_probability_max?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  weather_code?: number[];
}): WeatherData | null {
  if (!daily || !daily.precipitation_probability_max) return null;

  const precipitationProbability = daily.precipitation_probability_max[0] ?? 0;
  const temperatureMax = Math.round(daily.temperature_2m_max?.[0] ?? 28);
  const temperatureMin = Math.round(daily.temperature_2m_min?.[0] ?? 22);
  const weatherCode = daily.weather_code?.[0] ?? 0;

  const isRainExpected = precipitationProbability >= 40;
  const isHotDay = temperatureMax >= 32;
  const isColdDay = temperatureMax <= 15;

  let description = "Clear & pleasant";
  let suggestion: string | null = null;
  let suggestedItem: { name: string; emoji: string } | null = null;

  if (isRainExpected) {
    description = `Rain expected (${precipitationProbability}%)`;
    suggestion = `Rain predicted today (${precipitationProbability}%) — pack an umbrella or raincoat!`;
    suggestedItem = { name: "Umbrella", emoji: "Umbrella" };
  } else if (isHotDay) {
    description = `Sunny & hot (${temperatureMax}°C)`;
    suggestion = `High heat today (${temperatureMax}°C) — bring sunglasses & sunscreen!`;
    suggestedItem = { name: "Sunglasses", emoji: "Glasses" };
  } else if (isColdDay) {
    description = `Chilly weather (${temperatureMax}°C)`;
    suggestion = `Cold day (${temperatureMax}°C) — pack a warm jacket!`;
    suggestedItem = { name: "Jacket", emoji: "Shirt" };
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
  };
}

describe("Feature 15: Weather Engine & 3 Threshold Rules", () => {
  it("T1.15.2 & T2.12 - T2.13: Rain threshold rule (>=40% triggers Umbrella suggestion)", () => {
    // 39% -> No rain warning
    const subRain = evaluateWeatherData({
      precipitation_probability_max: [39],
      temperature_2m_max: [25],
      temperature_2m_min: [19],
      weather_code: [1],
    });
    assert.ok(subRain);
    assert.equal(subRain.isRainExpected, false);
    assert.equal(subRain.suggestedItem, null);

    // 40% -> Rain warning triggered
    const exactRain = evaluateWeatherData({
      precipitation_probability_max: [40],
      temperature_2m_max: [25],
      temperature_2m_min: [19],
      weather_code: [61],
    });
    assert.ok(exactRain);
    assert.equal(exactRain.isRainExpected, true);
    assert.deepEqual(exactRain.suggestedItem, { name: "Umbrella", emoji: "Umbrella" });
  });

  it("T1.15.3 & T2.14 - T2.15: Heat threshold rule (>=32°C triggers Sunglasses suggestion)", () => {
    // 31°C -> No heat warning
    const subHeat = evaluateWeatherData({
      precipitation_probability_max: [10],
      temperature_2m_max: [31],
      temperature_2m_min: [24],
      weather_code: [0],
    });
    assert.ok(subHeat);
    assert.equal(subHeat.isHotDay, false);
    assert.equal(subHeat.suggestedItem, null);

    // 32°C -> Heat warning triggered
    const exactHeat = evaluateWeatherData({
      precipitation_probability_max: [10],
      temperature_2m_max: [32],
      temperature_2m_min: [24],
      weather_code: [0],
    });
    assert.ok(exactHeat);
    assert.equal(exactHeat.isHotDay, true);
    assert.deepEqual(exactHeat.suggestedItem, { name: "Sunglasses", emoji: "Glasses" });
  });

  it("T1.15.4 & T2.16 - T2.17: Cold threshold rule (<=15°C triggers Jacket suggestion)", () => {
    // 16°C -> No cold warning
    const subCold = evaluateWeatherData({
      precipitation_probability_max: [10],
      temperature_2m_max: [16],
      temperature_2m_min: [10],
      weather_code: [0],
    });
    assert.ok(subCold);
    assert.equal(subCold.isColdDay, false);
    assert.equal(subCold.suggestedItem, null);

    // 15°C -> Cold warning triggered
    const exactCold = evaluateWeatherData({
      precipitation_probability_max: [10],
      temperature_2m_max: [15],
      temperature_2m_min: [8],
      weather_code: [0],
    });
    assert.ok(exactCold);
    assert.equal(exactCold.isColdDay, true);
    assert.deepEqual(exactCold.suggestedItem, { name: "Jacket", emoji: "Shirt" });
  });

  it("T2.11: Malformed or missing daily payload returns null gracefully", () => {
    assert.equal(evaluateWeatherData(null as unknown as any), null);
    assert.equal(evaluateWeatherData({} as any), null);
  });
});
