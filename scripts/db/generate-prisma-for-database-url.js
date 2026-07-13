/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..", "..");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

const envFileValues = {
  ...readEnvFile(path.join(projectRoot, ".env")),
  ...readEnvFile(path.join(projectRoot, ".env.local"))
};
const databaseUrl = process.env.DATABASE_URL || envFileValues.DATABASE_URL || "";

let schema = "prisma/schema.prisma";

if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
  schema = "prisma/postgresql/schema.prisma";
} else if (!databaseUrl.startsWith("file:")) {
  console.error("DATABASE_URL must start with file:, postgresql://, or postgres:// before Prisma Client generation.");
  process.exit(1);
}

console.log(`Generating Prisma Client with ${schema}`);

const result = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true
});

process.exit(result.status ?? 1);
