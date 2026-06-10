import { watch } from "fs";
import { execSync } from "child_process";
import { parseArgs } from "util";
import { dirname, resolve } from "path";

// 1. Parse CLI Arguments
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    watch: { type: "boolean", short: "w" },
  },
  strict: false,
  allowPositionals: true,
});

const [, , inputPath, outputPath] = positionals;

if (!inputPath || !outputPath) {
  console.error("Usage: bun build.ts <entry-less-file> <target-css-file> [--watch]");
  process.exit(1);
}

const ENTRY_POINT = resolve(inputPath);
const OUTPUT_CSS = resolve(outputPath);
const WATCH_DIR = dirname(ENTRY_POINT);

/**
 * Generates a Local ISO-8601 Timestamp
 */
function getLocalISOTime() {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().slice(0, -1);
}

/**
 * Execution Core
 */
function build() {
  const timestamp = getLocalISOTime();
  let success = false;
  let errorOutput = "";

  try {
    execSync(`bunx lessc --source-map --source-map-rootpath=less/ ${ENTRY_POINT} ${OUTPUT_CSS}`);
    success = true;
  } catch (e: any) {
    errorOutput = e.stdout?.toString() || e.stderr?.toString() || e.message;
  }

  // Only reset terminal if we are in watch mode
  if (values.watch) {
    process.stdout.write("\x1bc");
  }

  const statusLine = success ? "\x1b[32m✅ SUCCESS\x1b[0m" : "\x1b[31m❌ FAILED\x1b[0m";

  console.log("========================================");
  console.log("   LESS BUILD TOOL");
  console.log("========================================");
  console.log(`\x1b[1mStatus:\x1b[0m    ${statusLine}`);
  console.log(`\x1b[1mUpdated:\x1b[0m   ${timestamp}`);
  console.log(`\x1b[1mEntry:\x1b[0m     ${inputPath}`);
  console.log(`\x1b[1mOutput:\x1b[0m    ${outputPath}`);

  if (!success) {
    console.log("========================================");
    console.error(`\n\x1b[31m${errorOutput}\x1b[0m`);
  }

  if (values.watch && success) {
    console.log("\n----------------------------------------");
    console.log(`\x1b[2mMonitoring ${WATCH_DIR} ...\x1b[0m`);
  }
}

// Initial Build
build();

// 2. Conditional Watcher
if (values.watch) {
  watch(WATCH_DIR, { recursive: true }, (event, filename) => {
    if (filename?.endsWith(".less")) {
      build();
    }
  });
}
