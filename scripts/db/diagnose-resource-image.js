/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const slug = process.argv[2] || "100-kwp-solar-and-80-kwh-energy-storage-project-at-q-q-foods-limited";

function uploadRoot() {
  const configured = process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim();
  if (!configured) return path.join(process.cwd(), "public", "uploads");
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

function localUploadPath(url) {
  if (!url || !url.startsWith("/uploads/")) return null;
  const parts = url.split("/").filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const [, kind, maybeSubdir, maybeFileName] = parts;
  const fileName = maybeFileName || maybeSubdir;
  const subdir = maybeFileName ? maybeSubdir : "";
  return path.join(uploadRoot(), kind, subdir ? path.basename(subdir) : "", path.basename(fileName));
}

function describeUrl(label, url) {
  const filePath = localUploadPath(url);
  console.log(`${label}: ${url || "(empty)"}`);
  if (filePath) {
    console.log(`  local path: ${filePath}`);
    console.log(`  exists: ${fs.existsSync(filePath)}`);
  }
}

async function main() {
  const article = await prisma.resourceArticle.findFirst({
    where: { slug },
    select: {
      title: true,
      slug: true,
      coverImage: true,
      coverImageAlt: true,
      sourceProjectId: true
    }
  });

  if (!article) {
    console.log(`Article not found for slug: ${slug}`);
    return;
  }

  console.log(`Article: ${article.title}`);
  console.log(`Slug: ${article.slug}`);
  describeUrl("article.coverImage", article.coverImage);
  console.log(`article.coverImageAlt: ${article.coverImageAlt || "(empty)"}`);
  console.log(`article.sourceProjectId: ${article.sourceProjectId || "(empty)"}`);

  if (!article.sourceProjectId) return;

  const project = await prisma.project.findUnique({
    where: { id: article.sourceProjectId },
    select: {
      title: true,
      coverImage: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: { imagePath: true, isPrimary: true, sortOrder: true }
      }
    }
  });

  if (!project) {
    console.log("Linked project not found.");
    return;
  }

  console.log(`Project: ${project.title}`);
  describeUrl("project.coverImage", project.coverImage);
  project.images.forEach((image, index) => {
    describeUrl(`project.images[${index}] primary=${image.isPrimary} sort=${image.sortOrder}`, image.imagePath);
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
