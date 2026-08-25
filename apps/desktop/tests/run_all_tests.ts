import { spawn } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);

async function runTestSuite(testFile: string): Promise<{ file: string; exitCode: number; stdout: string; durationMs: number }> {
  const startTime = Date.now();
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, ["--experimental-strip-types", "--test", testFile], {
      cwd: currentDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (exitCode) => {
      const durationMs = Date.now() - startTime;
      resolvePromise({
        file: testFile,
        exitCode: exitCode ?? 0,
        stdout: stdout + (stderr ? "\nSTDERR:\n" + stderr : ""),
        durationMs,
      });
    });
  });
}

async function main() {
  console.log("================================================================================");
  console.log("             POCKETCHECK DESKTOP — AUTOMATED E2E & UNIT TEST SUITE              ");
  console.log("================================================================================\n");

  const testDir = existsSync(join(currentDir, "audio_synthesizer.test.ts"))
    ? currentDir
    : existsSync(join(process.cwd(), "tests"))
    ? join(process.cwd(), "tests")
    : join(process.cwd(), "apps", "desktop", "tests");
  const testFiles = readdirSync(testDir)
    .filter((f) => f.endsWith(".test.ts"))
    .map((f) => join(testDir, f));

  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  const suiteResults: Array<{ name: string; passed: boolean; durationMs: number; testCount: number }> = [];

  const overallStartTime = Date.now();

  for (const file of testFiles) {
    const filename = file.split(/[\\/]/).pop()!;
    process.stdout.write(`• Running [${filename}] ... `);
    const result = await runTestSuite(file);

    // Extract test count and pass count from TAP / spec output
    const matchPass = result.stdout.match(/ℹ pass (\d+)/);
    const matchFail = result.stdout.match(/ℹ fail (\d+)/);
    const matchTotal = result.stdout.match(/ℹ tests (\d+)/);

    const passCount = matchPass ? parseInt(matchPass[1], 10) : (result.exitCode === 0 ? 1 : 0);
    const failCount = matchFail ? parseInt(matchFail[1], 10) : (result.exitCode !== 0 ? 1 : 0);
    const count = matchTotal ? parseInt(matchTotal[1], 10) : passCount + failCount;

    totalPassed += passCount;
    totalFailed += failCount;
    totalTests += count;

    const isSuccess = result.exitCode === 0 && failCount === 0;
    suiteResults.push({
      name: filename,
      passed: isSuccess,
      durationMs: result.durationMs,
      testCount: count,
    });

    if (isSuccess) {
      console.log(`PASSED (${count} tests in ${result.durationMs}ms)`);
    } else {
      console.log(`FAILED! (${failCount} failures in ${result.durationMs}ms)`);
      console.error(result.stdout);
    }
  }

  const overallDuration = Date.now() - overallStartTime;

  console.log("\n--------------------------------------------------------------------------------");
  console.log("                               SUMMARY RESULTS                                  ");
  console.log("--------------------------------------------------------------------------------");
  console.table(
    suiteResults.map((s) => ({
      "Test Suite": s.name,
      Status: s.passed ? "PASS" : "FAIL",
      Tests: s.testCount,
      "Duration (ms)": s.durationMs,
    }))
  );

  console.log(`\nTotal Test Suites: ${suiteResults.length}`);
  console.log(`Total Assertions/Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed} ✅`);
  console.log(`Failed: ${totalFailed} ❌`);
  console.log(`Overall Execution Time: ${overallDuration}ms`);
  console.log("================================================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running test runner:", err);
  process.exit(1);
});
