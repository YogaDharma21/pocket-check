import test from "node:test";
import assert from "node:assert/strict";
import { evaluateWeatherData } from "../src/index.ts";

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
