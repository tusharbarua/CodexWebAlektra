/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();
const projectRoot = path.resolve(__dirname, "..", "..");

const KEY_MODELS = [
  "User",
  "Customer",
  "Order",
  "ProductCategory",
  "Product",
  "ProductImage",
  "Project",
  "ProjectImage",
  "ResourceCategory",
  "ResourceArticle",
  "Page",
  "PageSection",
  "PageSectionItem",
  "SiteContent",
  "SiteSettings",
  "HeroMedia",
  "ImpactSnapshot",
  "LegalDocument",
  "ShopLegalContent",
  "DeliveryCharge",
  "EcommerceDeliverySetting",
  "EcommerceCheckoutSetting",
  "PaymentInstructionSetting",
  "ThermalInspectionRequest",
  "SparkleServiceRequest",
  "MappingServiceRequest",
  "EpcProposalRequest"
];

const REQUIRED_BRAND_FILES = [
  "public/brand/alektra-renewable-logo.png",
  "public/brand/alektra-thermal-logo.png",
  "public/brand/alektra-sparkle-logo.png",
  "public/brand/alektra-mapping-logo.png"
];

const delegateName = (modelName) => modelName.charAt(0).toLowerCase() + modelName.slice(1);
const modelNames = new Set(Prisma.dmmf.datamodel.models.map((model) => model.name));

function databaseSummary(value) {
  if (!value) return { present: false };
  try {
    if (value.startsWith("file:")) return { present: true, providerHint: "sqlite", value: "file:***" };
    const url = new URL(value);
    return {
      present: true,
      providerHint: url.protocol.replace(":", ""),
      host: url.hostname || null,
      port: url.port || null,
      database: url.pathname ? url.pathname.replace(/^\//, "") : null
    };
  } catch {
    return { present: true, providerHint: "unknown", value: "unparseable" };
  }
}

function generatedClientProvider() {
  try {
    const clientEntry = require.resolve("@prisma/client");
    const schemaPath = path.resolve(path.dirname(clientEntry), "../../.prisma/client/schema.prisma");
    if (!fs.existsSync(schemaPath)) return null;
    const schema = fs.readFileSync(schemaPath, "utf8");
    return schema.match(/datasource\s+db\s*{[\s\S]*?provider\s*=\s*"([^"]+)"/)?.[1] ?? null;
  } catch {
    return null;
  }
}

function publicPathFromReference(value) {
  if (!value || typeof value !== "string") return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return null;
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.startsWith("public/")) return normalized;
  if (normalized.startsWith("uploads/") || normalized.startsWith("brand/") || normalized.startsWith("videos/")) {
    return path.join("public", normalized).replace(/\\/g, "/");
  }
  return null;
}

function exists(relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function directoryInfo(relativePath) {
  const absolute = path.join(projectRoot, relativePath);
  const info = { path: relativePath, exists: fs.existsSync(absolute), writable: false, fileCount: 0 };
  if (!info.exists) return info;
  try {
    fs.accessSync(absolute, fs.constants.W_OK);
    info.writable = true;
  } catch {
    info.writable = false;
  }
  const stack = [absolute];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile()) info.fileCount += 1;
    }
  }
  return info;
}

async function countModel(modelName) {
  if (!modelNames.has(modelName)) return null;
  return prisma[delegateName(modelName)].count();
}

async function migrationInfo() {
  try {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 8'
    );
    return rows.map((row) => ({
      migrationName: row.migration_name,
      finishedAt: row.finished_at
    }));
  } catch {
    return [];
  }
}

async function pageDiagnostics() {
  const pages = await prisma.page.findMany({
    select: {
      pageKey: true,
      status: true,
      sections: {
        select: {
          sectionKey: true,
          isPublished: true,
          _count: { select: { items: true } }
        },
        orderBy: { sortOrder: "asc" }
      }
    },
    orderBy: { pageKey: "asc" }
  });

  return pages.map((page) => ({
    pageKey: page.pageKey,
    status: page.status,
    sectionCount: page.sections.length,
    publishedSectionCount: page.sections.filter((section) => section.isPublished).length,
    itemCount: page.sections.reduce((sum, section) => sum + section._count.items, 0),
    sections: page.sections.map((section) => ({
      key: section.sectionKey,
      published: section.isPublished,
      itemCount: section._count.items
    }))
  }));
}

async function statusDiagnostics() {
  const [products, projects, articles, pages] = await Promise.all([
    prisma.product.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
    prisma.project.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
    prisma.resourceArticle.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
    prisma.page.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => [])
  ]);
  const mapRows = (rows) => Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
  return {
    products: mapRows(products),
    projects: mapRows(projects),
    resourceArticles: mapRows(articles),
    pages: mapRows(pages)
  };
}

async function mediaDiagnostics() {
  const references = new Set();
  for (const file of REQUIRED_BRAND_FILES) references.add(file);

  const [heroMedia, productImages, projectImages, projects, articles, products] = await Promise.all([
    prisma.heroMedia.findMany({ select: { url: true, filePath: true, posterImagePath: true } }).catch(() => []),
    prisma.productImage.findMany({ select: { imagePath: true } }).catch(() => []),
    prisma.projectImage.findMany({ select: { imagePath: true } }).catch(() => []),
    prisma.project.findMany({ select: { coverImage: true } }).catch(() => []),
    prisma.resourceArticle.findMany({ select: { coverImage: true } }).catch(() => []),
    prisma.product.findMany({ select: { datasheetUrl: true, manualUrl: true } }).catch(() => [])
  ]);

  for (const row of heroMedia) {
    [row.url, row.filePath, row.posterImagePath].forEach((value) => {
      const ref = publicPathFromReference(value);
      if (ref) references.add(ref);
    });
  }
  for (const row of productImages) {
    const ref = publicPathFromReference(row.imagePath);
    if (ref) references.add(ref);
  }
  for (const row of projectImages) {
    const ref = publicPathFromReference(row.imagePath);
    if (ref) references.add(ref);
  }
  for (const row of projects) {
    const ref = publicPathFromReference(row.coverImage);
    if (ref) references.add(ref);
  }
  for (const row of articles) {
    const ref = publicPathFromReference(row.coverImage);
    if (ref) references.add(ref);
  }
  for (const row of products) {
    [row.datasheetUrl, row.manualUrl].forEach((value) => {
      const ref = publicPathFromReference(value);
      if (ref) references.add(ref);
    });
  }

  const all = [...references].sort();
  const missing = all.filter((ref) => !exists(ref));
  return {
    directories: [directoryInfo("public/uploads"), directoryInfo("storage"), directoryInfo("storage/thermal")],
    referencedLocalMedia: all.length,
    missingLocalMedia: missing.length,
    missingExamples: missing.slice(0, 30)
  };
}

async function main() {
  const counts = {};
  for (const modelName of KEY_MODELS) {
    counts[modelName] = await countModel(modelName);
  }

  const [migrations, pages, statuses, media] = await Promise.all([
    migrationInfo(),
    pageDiagnostics(),
    statusDiagnostics(),
    mediaDiagnostics()
  ]);

  const result = {
    checkedAt: new Date().toISOString(),
    database: databaseSummary(process.env.DATABASE_URL || ""),
    generatedPrismaClientProvider: generatedClientProvider(),
    migrations,
    counts,
    statuses,
    pages,
    media
  };

  console.log(JSON.stringify(result, null, 2));

  const likelyEmpty =
    (counts.Product ?? 0) === 0 ||
    (counts.PageSection ?? 0) === 0 ||
    (counts.PageSectionItem ?? 0) === 0;

  if (process.argv.includes("--verify") && likelyEmpty) {
    console.error("Deployment verification failed: expected product/CMS content is missing. Import SQLite export into PostgreSQL and copy persistent media.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
