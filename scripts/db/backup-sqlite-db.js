/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const source = process.argv[2]
  ? path.resolve(projectRoot, process.argv[2])
  : path.join(projectRoot, "dev.db");

if (!fs.existsSync(source)) {
  console.error(`SQLite database not found: ${source}`);
  process.exit(1);
}

const backupDir = path.join(projectRoot, "backups", "sqlite");
fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const destination = path.join(backupDir, `${path.basename(source, path.extname(source))}-${stamp}.db`);

fs.copyFileSync(source, destination);

const { size } = fs.statSync(destination);
console.log(`SQLite backup created: ${destination}`);
console.log(`Size: ${size} bytes`);
