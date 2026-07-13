const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const appRoot = process.cwd();
const databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl) {
  console.error("DATABASE_URL is required for production startup.");
  process.exit(1);
}

if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  console.error("Production DATABASE_URL must use PostgreSQL. Refusing to start with a non-PostgreSQL datasource.");
  process.exit(1);
}

function ensureDirectory(relativePath) {
  fs.mkdirSync(path.join(appRoot, relativePath), { recursive: true });
}

function copySeedFiles(seedRelativePath, targetRelativePath) {
  const source = path.join(appRoot, seedRelativePath);
  const target = path.join(appRoot, targetRelativePath);
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, target, {
    recursive: true,
    force: false,
    errorOnExist: false
  });
}

function generatedClientProvider() {
  const clientEntry = require.resolve("@prisma/client");
  const schemaPath = path.resolve(path.dirname(clientEntry), "../../.prisma/client/schema.prisma");
  if (!fs.existsSync(schemaPath)) return undefined;
  const schema = fs.readFileSync(schemaPath, "utf8");
  return schema.match(/datasource\s+db\s*{[\s\S]*?provider\s*=\s*"([^"]+)"/)?.[1];
}

ensureDirectory("public/uploads");
ensureDirectory("storage");
ensureDirectory("storage/thermal");
copySeedFiles(".image-seed/uploads", "public/uploads");

const provider = generatedClientProvider();
if (provider && provider !== "postgresql") {
  console.error(`Generated Prisma Client provider is "${provider}", expected "postgresql".`);
  process.exit(1);
}

const prismaBin = path.join(appRoot, "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
const migration = spawnSync(prismaBin, ["migrate", "deploy", "--schema", "prisma/postgresql/schema.prisma"], {
  cwd: appRoot,
  env: process.env,
  stdio: "inherit"
});

if (migration.status !== 0) {
  console.error("Prisma migration failed. Application startup stopped.");
  process.exit(migration.status || 1);
}

const nextBin = path.join(appRoot, "node_modules", "next", "dist", "bin", "next");
const server = spawn("node", [nextBin, "start", "-H", "0.0.0.0", "-p", process.env.PORT || "3000"], {
  cwd: appRoot,
  env: {
    ...process.env,
    HOSTNAME: "0.0.0.0",
    PORT: process.env.PORT || "3000"
  },
  stdio: "inherit"
});

function forward(signal) {
  if (!server.killed) server.kill(signal);
}

process.on("SIGTERM", () => forward("SIGTERM"));
process.on("SIGINT", () => forward("SIGINT"));

server.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code || 0);
});
