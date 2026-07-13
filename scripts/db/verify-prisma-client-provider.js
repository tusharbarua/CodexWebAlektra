/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const expectedProvider = process.argv[2] || "postgresql";

function findGeneratedSchema() {
  const clientEntry = require.resolve("@prisma/client");
  const candidates = [
    path.resolve(path.dirname(clientEntry), "../../.prisma/client/schema.prisma"),
    path.resolve(process.cwd(), "node_modules/.prisma/client/schema.prisma")
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

const schemaPath = findGeneratedSchema();

if (!schemaPath) {
  console.error("Generated Prisma Client schema.prisma was not found. Run prisma generate first.");
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, "utf8");
const match = schema.match(/datasource\s+db\s*{[\s\S]*?provider\s*=\s*"([^"]+)"/);
const actualProvider = match?.[1];

if (actualProvider !== expectedProvider) {
  console.error(`Generated Prisma Client provider mismatch. Expected "${expectedProvider}", found "${actualProvider || "unknown"}".`);
  console.error(`Generated client schema: ${schemaPath}`);
  process.exit(1);
}

console.log(`Generated Prisma Client provider is "${actualProvider}".`);
console.log(`Generated client schema: ${schemaPath}`);
