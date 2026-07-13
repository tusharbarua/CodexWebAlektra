/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();
const projectRoot = path.resolve(__dirname, "..", "..");

const inputArgIndex = process.argv.indexOf("--input");
const inputPath = inputArgIndex >= 0 && process.argv[inputArgIndex + 1]
  ? path.resolve(projectRoot, process.argv[inputArgIndex + 1])
  : null;
const shouldTruncate = process.argv.includes("--truncate");

if (!inputPath) {
  console.error("Missing input file. Usage: node scripts/db/import-json-to-postgres.js --input backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json");
  process.exit(1);
}

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgresql://")) {
  console.error("Refusing to import: DATABASE_URL must be a PostgreSQL URL.");
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Export file not found: ${inputPath}`);
  process.exit(1);
}

const IMPORT_ORDER = [
  "AppRole",
  "AppRolePermission",
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "Customer",
  "CustomerEmailVerificationToken",
  "CustomerPasswordResetToken",
  "CustomerAddress",
  "SeoMetadata",
  "SiteContent",
  "Page",
  "PageSection",
  "PageSectionItem",
  "SiteSettings",
  "HeroMedia",
  "Project",
  "ProjectImage",
  "ImpactSnapshot",
  "ImpactDailyLedger",
  "MonitoringIntegration",
  "ResourceCategory",
  "ResourceArticle",
  "ProductCategory",
  "Product",
  "ProductImage",
  "Coupon",
  "DeliveryCharge",
  "EcommerceDeliverySetting",
  "EcommerceCheckoutSetting",
  "PaymentInstructionSetting",
  "ShopLegalContent",
  "LegalDocument",
  "MessagingIntegration",
  "LocationDatasetSetting",
  "OtpVerification",
  "Order",
  "OrderStatusHistory",
  "OrderItem",
  "PaymentTransaction",
  "NotificationLog",
  "ContactSubmission",
  "ThermalInspectionRequest",
  "SparkleServiceRequest",
  "MappingServiceRequest",
  "EpcProposalRequest",
  "ThermalBaseLocation",
  "ThermalPricingRule"
];

const modelByName = new Map(Prisma.dmmf.datamodel.models.map((model) => [model.name, model]));
const delegateName = (modelName) => modelName.charAt(0).toLowerCase() + modelName.slice(1);

function normalizeRow(modelName, row) {
  const model = modelByName.get(modelName);
  if (!model) return row;

  const normalized = { ...row };
  for (const field of model.fields) {
    if (!(field.name in normalized) || normalized[field.name] == null) continue;
    if (field.kind === "object") {
      delete normalized[field.name];
      continue;
    }
    if (field.type === "DateTime") normalized[field.name] = new Date(normalized[field.name]);
    if (field.type === "Decimal") normalized[field.name] = String(normalized[field.name]);
  }
  return normalized;
}

async function assertEmptyDestination() {
  const nonEmpty = [];
  for (const modelName of IMPORT_ORDER) {
    const delegate = prisma[delegateName(modelName)];
    const count = await delegate.count();
    if (count > 0) nonEmpty.push(`${modelName}:${count}`);
  }

  if (nonEmpty.length && !shouldTruncate) {
    throw new Error(`Destination PostgreSQL database is not empty (${nonEmpty.join(", ")}). Re-run with --truncate only after confirming this database can be cleared.`);
  }
}

async function truncateDestination() {
  for (const modelName of [...IMPORT_ORDER].reverse()) {
    await prisma[delegateName(modelName)].deleteMany();
  }
}

async function main() {
  const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (!payload.models || typeof payload.models !== "object") {
    throw new Error("Invalid export file: missing models object.");
  }

  await assertEmptyDestination();
  if (shouldTruncate) await truncateDestination();

  const imported = {};
  for (const modelName of IMPORT_ORDER) {
    const rows = payload.models[modelName] || [];
    if (!rows.length) {
      imported[modelName] = 0;
      continue;
    }
    const data = rows.map((row) => normalizeRow(modelName, row));
    await prisma[delegateName(modelName)].createMany({ data });
    imported[modelName] = rows.length;
    console.log(`Imported ${modelName}: ${rows.length}`);
  }

  console.log("PostgreSQL import completed.");
  console.log(JSON.stringify(imported, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
