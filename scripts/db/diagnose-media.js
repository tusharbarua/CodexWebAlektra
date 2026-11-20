/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs/promises");
const { constants } = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { uploadRoot, uploadMount, isWritablePersistentMount } = require("../docker/upload-storage");

const prisma = new PrismaClient();
const root = uploadRoot();
const publicRoot = path.resolve("public/uploads");
const issues = [];
const files = new Map();
let externalImages = 0;

const imageMime = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".gif": "image/gif", ".avif": "image/avif"
};

function flag(record, field, problem, url, severity = "error") {
  issues.push({ record, field, problem, severity, ...(url ? { url } : {}) });
}

function reportMedia(record, field, value, required = false) {
  const url = typeof value === "string" ? value.trim() : "";
  if (!url) {
    if (required) flag(record, field, "missing-cover", undefined, "warning");
    return;
  }

  const absolute = URL.canParse(url) ? new URL(url) : null;
  const local = absolute && ["alektraepc.com", "www.alektraepc.com"].includes(absolute.hostname)
    ? absolute.pathname : url;
  if (!local.startsWith("/")) {
    if (/^https?:\/\//i.test(url)) externalImages += 1;
    else flag(record, field, "unsupported-image-reference", url);
    return;
  }

  const pathname = local.split(/[?#]/)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    flag(record, field, "invalid-url-encoding", pathname);
    return;
  }
  const segments = decoded.split("/").slice(1);
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || /[\\\u0000-\u001f]/.test(segment))) {
    flag(record, field, "invalid-file-path", pathname);
    return;
  }
  const managed = segments[0] === "uploads";
  if (managed && (segments.length < 3 || segments.length > 4)) {
    flag(record, field, "unsupported-upload-path", pathname);
    return;
  }

  const file = files.get(pathname) ?? { managed, segments, references: [] };
  file.references.push({ record, field });
  files.set(pathname, file);
}

function reportEmbeddedImages(record, field, html) {
  for (const [, value] of html?.matchAll(/<img\b[^>]*?\s+src\s*=\s*["']([^"']+)["']/gi) ?? []) {
    reportMedia(record, field, value.replaceAll("&amp;", "&"));
  }
}

async function fileStatus(filePath) {
  try {
    const file = await fs.open(filePath, "r");
    try {
      const info = await file.stat();
      return info.isFile() && info.size > 0 ? "ok" : "empty-or-not-a-file";
    } finally {
      await file.close();
    }
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes(error.code)) return "file-missing";
    if (["EACCES", "EPERM"].includes(error.code)) return "file-unreadable";
    throw error;
  }
}

async function httpStatus(origin, pathname) {
  const response = await fetch(new URL(pathname, origin), {
    headers: { Range: "bytes=0-15" }, redirect: "manual", signal: AbortSignal.timeout(10000)
  });
  const contentType = response.headers.get("content-type")?.split(";")[0];
  await response.body?.cancel();
  if (![200, 206].includes(response.status)) return `http-${response.status}`;
  const expected = imageMime[path.extname(pathname).toLowerCase()];
  if (expected ? contentType !== expected : !contentType?.startsWith("image/")) return "unexpected-http-content-type";
  return null;
}

async function notify(count) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PASSWORD, SMTP_SECURE, SMTP_REQUIRE_TLS, SMTP_PORT,
    SMTP_FROM, MAIL_FROM_EMAIL, ADMIN_NOTIFICATION_EMAIL, ADMIN_EMAIL } = process.env;
  const recipient = ADMIN_NOTIFICATION_EMAIL ?? ADMIN_EMAIL;
  if (!recipient || !SMTP_HOST || !SMTP_USER || !(SMTP_PASS ?? SMTP_PASSWORD)) {
    throw new Error("Media audit alert not sent: application SMTP or administrator recipient is missing.");
  }
  const port = Number(SMTP_PORT ?? 587);
  await require("nodemailer").createTransport({
    host: SMTP_HOST, port, secure: SMTP_SECURE ? SMTP_SECURE === "true" : port === 465,
    requireTLS: SMTP_REQUIRE_TLS !== "false",
    auth: { user: SMTP_USER, pass: SMTP_PASS ?? SMTP_PASSWORD },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
  }).sendMail({
    from: SMTP_FROM ?? MAIL_FROM_EMAIL ?? SMTP_USER,
    to: recipient,
    subject: "Alektra website media audit failed",
    text: `The website media audit reported ${count} issue(s). Review the private Dokploy Scheduled Jobs log for details.`
  });
}

async function main() {
  const args = process.argv.slice(2);
  const originArgument = args.find((arg) => arg.startsWith("--origin="));
  const origin = originArgument && new URL(originArgument.slice("--origin=".length));
  if (origin && !["https:", "http:"].includes(origin.protocol)) throw new Error("Use an HTTP(S) origin.");
  const mount = await fs.access(root, constants.R_OK | constants.W_OK | constants.X_OK)
    .then(() => uploadMount(root), () => {
      flag("Upload storage", "UPLOAD_DIR", "directory-missing-or-inaccessible");
      return null;
    });
  if (args.includes("--require-mount") && !isWritablePersistentMount(mount)) {
    flag("Upload storage", "mount", "no-writable-persistent-mount");
  }
  const [projects, articles] = await Promise.all([
    prisma.project.findMany({ select: {
      id: true, title: true, slug: true, status: true, coverImage: true, imageUrls: true, fullCaseStudy: true,
      images: { select: { id: true, imagePath: true, isPrimary: true, sortOrder: true }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] }
    }, orderBy: { slug: "asc" } }),
    prisma.resourceArticle.findMany({ select: {
      title: true, slug: true, status: true, sourceProjectId: true, coverImage: true, body: true
    }, orderBy: { slug: "asc" } })
  ]);

  const projectsById = new Map(projects.map((project) => [project.id, project]));
  for (const project of projects) {
    const record = `Project ${project.title} (${project.slug})`;
    reportMedia(record, "coverImage", project.coverImage, project.status === "PUBLISHED");
    for (const image of project.images) reportMedia(record, `images[${image.id}].imagePath`, image.imagePath);
    if (Array.isArray(project.imageUrls)) project.imageUrls.forEach((url, index) => reportMedia(record, `imageUrls[${index}]`, url));
    reportEmbeddedImages(record, "fullCaseStudy", project.fullCaseStudy);
  }

  for (const article of articles) {
    const record = `Resource ${article.title} (${article.slug})`;
    const sourceProject = projectsById.get(article.sourceProjectId);
    const cover = article.coverImage ?? sourceProject?.coverImage ?? sourceProject?.images[0]?.imagePath;
    reportMedia(record, "coverImage", cover, article.status === "PUBLISHED" && Boolean(article.sourceProjectId));
    reportEmbeddedImages(record, "body", article.body);
  }

  for (const [url, { managed, segments, references }] of files) {
    if (!managed) continue;
    const expected = path.join(root, ...segments.slice(1));
    const file = await fileStatus(expected);
    let error = file === "ok" ? null : file;
    if (error && root !== publicRoot && await fileStatus(path.join(publicRoot, ...segments.slice(1))) === "ok") {
      error = "file-only-in-public-uploads";
    }
    if (origin) {
      const delivery = await httpStatus(origin, url).catch(() => "http-check-failed");
      if (delivery) for (const { record, field } of references) flag(record, field, delivery, url);
    }
    if (error) for (const { record, field } of references) flag(record, field, error, url);
  }

  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(), root, mount, projects: projects.length, resources: articles.length,
    fileUrls: files.size, externalImages, issues
  }, null, 2));
  const errors = issues.filter(({ severity }) => severity === "error");
  if (errors.length) {
    process.exitCode = 1;
    if (args.includes("--notify")) await notify(errors.length);
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? `${error.name}: media audit failed or an alert could not be sent` : "Media audit could not finish");
  process.exitCode = 1;
  if (process.argv.includes("--notify") && !issues.length) {
    await notify(1).catch(() => console.error("Media audit alert could not be sent"));
  }
}).finally(() => prisma.$disconnect());
