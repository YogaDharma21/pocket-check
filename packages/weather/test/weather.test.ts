import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateWeatherData,
  isWeatherCacheFresh,
  getRoundedCoordsKey,
} from "../src/index.ts";

test("evaluateWeatherData returns null on missing daily or precipitation", () => {
  assert.equal(evaluateWeatherData({}), null);
});

test("evaluateWeatherData identifies rain when precipitation >= 40", () => {
  const result = evaluateWeatherData({
    precipitation_probability_max: [50],
    temperature_2m_max: [25],
    temperature_2m_min: [20],
    weather_code: [61]
  });
  assert.ok(result);
  assert.equal(result.isRainExpected, true);
  assert.equal(result.suggestedItem?.name, "Umbrella");
});

test("isWeatherCacheFresh and getRoundedCoordsKey validate cache freshness", () => {
  const coordsKey = getRoundedCoordsKey(-6.2088, 106.8456);
  assert.equal(coordsKey, "-6.21,106.85");

  const mockData = evaluateWeatherData({
    precipitation_probability_max: [10],
    temperature_2m_max: [28],
    temperature_2m_min: [22],
    weather_code: [1],
  })!;

  const freshEntry = {
    data: mockData,
    timestamp: Date.now() - 5 * 60 * 1000, // 5 mins ago
    coordsKey,
  };
  assert.equal(isWeatherCacheFresh(freshEntry, 30 * 60 * 1000), true);

  const staleEntry = {
    data: mockData,
    timestamp: Date.now() - 40 * 60 * 1000, // 40 mins ago
    coordsKey,
  };
  assert.equal(isWeatherCacheFresh(staleEntry, 30 * 60 * 1000), false);
  assert.equal(isWeatherCacheFresh(null), false);
});

