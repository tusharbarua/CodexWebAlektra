/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();
const projectRoot = path.resolve(__dirname, "..", "..");
const exportDir = path.join(projectRoot, "backups", "sqlite-export");

const outputArgIndex = process.argv.indexOf("--output");
const outputPath = outputArgIndex >= 0 && process.argv[outputArgIndex + 1]
  ? path.resolve(projectRoot, process.argv[outputArgIndex + 1])
  : path.join(exportDir, `sqlite-export-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-")}.json`);

const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name);
const delegateName = (modelName) => modelName.charAt(0).toLowerCase() + modelName.slice(1);

async function main() {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const models = {};
  const counts = {};

  for (const modelName of modelNames) {
    const delegate = prisma[delegateName(modelName)];
    const rows = await delegate.findMany();
    models[modelName] = rows;
    counts[modelName] = rows.length;
  }

  const payload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      source: "sqlite",
      databaseUrl: process.env.DATABASE_URL || null,
      modelCount: modelNames.length,
      counts
    },
    models
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`SQLite data exported: ${outputPath}`);
  console.log(`Models exported: ${modelNames.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
