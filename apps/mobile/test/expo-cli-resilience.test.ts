import assert from "node:assert";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("validateDependenciesVersionsAsync handles fetch failure without throwing", async () => {
  const expoPath = require.resolve("expo/package.json");
  const validateDepsPath = require.resolve(
    "@expo/cli/build/src/start/doctor/dependencies/validateDependenciesVersions.js",
    { paths: [expoPath] }
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new TypeError("fetch failed"));
  process.env.EXPO_NO_CACHE = "1";

  try {
    const { validateDependenciesVersionsAsync } = require(validateDepsPath);
    const exp = { sdkVersion: "54.0.0", name: "mobile", slug: "mobile" };
    const pkg = { name: "mobile", version: "1.0.0", dependencies: {} };

    const result = await validateDependenciesVersionsAsync(
      path.resolve(__dirname, ".."),
      exp,
      pkg
    );

    assert.notStrictEqual(result, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.EXPO_NO_CACHE;
  }
});
