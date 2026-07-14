/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require("child_process");

const baseUrlArgIndex = process.argv.indexOf("--url");
const baseUrl = baseUrlArgIndex >= 0 && process.argv[baseUrlArgIndex + 1]
  ? process.argv[baseUrlArgIndex + 1].replace(/\/$/, "")
  : null;

const paths = [
  "/",
  "/thermal",
  "/sparkle",
  "/mapping",
  "/company",
  "/resources",
  "/shop",
  "/account/login",
  "/admin/login",
  "/api/health",
  "/brand/alektra-renewable-logo-asset-v3.png",
  "/brand/alektra-thermal-logo.png",
  "/brand/alektra-sparkle-logo.png",
  "/brand/alektra-mapping-logo.png"
];

async function checkUrl(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, { redirect: "manual" });
    return {
      url,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      ms: Date.now() - started
    };
  } catch (error) {
    return {
      url,
      status: "ERROR",
      ok: false,
      ms: Date.now() - started,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

async function main() {
  console.log("Running database and media diagnostics...");
  const dbCheck = spawnSync(process.execPath, ["scripts/db/diagnose-production-data.js", "--verify"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit"
  });

  let urlFailed = false;
  if (baseUrl) {
    console.log(`\nChecking public URLs on ${baseUrl}...`);
    const results = [];
    for (const item of paths) {
      results.push(await checkUrl(`${baseUrl}${item}`));
    }
    console.log(JSON.stringify(results, null, 2));
    urlFailed = results.some((result) => !result.ok);
  } else {
    console.log("\nSkipping public URL checks. Pass -- --url https://your-host to include them.");
  }

  if (dbCheck.status !== 0 || urlFailed) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
