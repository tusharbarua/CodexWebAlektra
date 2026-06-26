"use server";

import { PublishStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) throw new Error("Unauthorized");
  return session.user;
}

const text = (value: FormDataEntryValue | null) => String(value ?? "").trim();
const optional = (value: FormDataEntryValue | null) => text(value) || null;
const status = (value: FormDataEntryValue | null) =>
  z.nativeEnum(PublishStatus).parse(text(value) || PublishStatus.DRAFT);
const lines = (value: FormDataEntryValue | null) =>
  text(value).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

function refresh(...paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    sku: z.string().min(2),
    model: z.string().min(1),
    brand: z.string().min(1),
    categoryId: z.string().min(1),
    priceBdt: z.coerce.number().nonnegative(),
    stockQuantity: z.coerce.number().int().nonnegative(),
    shortDescription: z.string().min(10),
    technicalDescription: z.string().min(10),
    specifications: z.string().min(2),
    datasheetUrl: z.string().optional(),
    manualUrl: z.string().optional(),
    status: z.nativeEnum(PublishStatus)
  });
  const data = schema.parse({
    id: optional(formData.get("id")) ?? undefined,
    name: text(formData.get("name")),
    slug: text(formData.get("slug")),
    sku: text(formData.get("sku")),
    model: text(formData.get("model")),
    brand: text(formData.get("brand")),
    categoryId: text(formData.get("categoryId")),
    priceBdt: text(formData.get("priceBdt")),
    stockQuantity: text(formData.get("stockQuantity")),
    shortDescription: text(formData.get("shortDescription")),
    technicalDescription: text(formData.get("technicalDescription")),
    specifications: text(formData.get("specifications")),
    datasheetUrl: text(formData.get("datasheetUrl")),
    manualUrl: text(formData.get("manualUrl")),
    status: status(formData.get("status"))
  });
  const specifications = Object.fromEntries(
    data.specifications.split(/\r?\n/).map((row) => {
      const [key, ...rest] = row.split(":");
      return [key.trim(), rest.join(":").trim()];
    }).filter(([key, value]) => key && value)
  );
  const productData = {
    name: data.name,
    slug: data.slug,
    sku: data.sku,
    model: data.model,
    brand: data.brand,
    categoryId: data.categoryId,
    priceBdt: data.priceBdt,
    stockQuantity: data.stockQuantity,
    shortDescription: data.shortDescription,
    technicalDescription: data.technicalDescription,
    specifications,
    datasheetUrl: data.datasheetUrl || null,
    manualUrl: data.manualUrl || null,
    isFeatured: formData.get("isFeatured") === "on",
    status: data.status
  };
  const product = data.id
    ? await prisma.product.update({ where: { id: data.id }, data: productData })
    : await prisma.product.create({ data: productData });
  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  const imageUrls = lines(formData.get("imageUrls"));
  if (imageUrls.length) {
    await prisma.productImage.createMany({
      data: imageUrls.map((url, index) => ({ productId: product.id, url, alt: product.name, sortOrder: index }))
    });
  }
  refresh("/", "/shop", `/shop/${product.slug}`, "/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: z.string().parse(formData.get("id")) } });
  refresh("/", "/shop", "/admin/products");
}

export async function saveProductCategory(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: z.string().optional()
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    name: text(formData.get("name")),
    slug: text(formData.get("slug")),
    description: text(formData.get("description"))
  });
  if (data.id) await prisma.productCategory.update({ where: { id: data.id }, data });
  else await prisma.productCategory.create({ data });
  refresh("/shop", "/admin/categories", "/admin/products");
  redirect("/admin/categories");
}

export async function deleteProductCategory(formData: FormData) {
  await requireAdmin();
  await prisma.productCategory.delete({ where: { id: z.string().parse(formData.get("id")) } });
  refresh("/shop", "/admin/categories");
}

export async function saveResourceCategory(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: z.string().min(3)
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    name: text(formData.get("name")),
    slug: text(formData.get("slug")),
    description: text(formData.get("description"))
  });
  if (data.id) await prisma.resourceCategory.update({ where: { id: data.id }, data });
  else await prisma.resourceCategory.create({ data });
  refresh("/", "/resources", "/admin/categories", "/admin/resources");
  redirect("/admin/categories");
}

export async function deleteResourceCategory(formData: FormData) {
  await requireAdmin();
  await prisma.resourceCategory.delete({ where: { id: z.string().parse(formData.get("id")) } });
  refresh("/", "/resources", "/admin/categories");
}

export async function saveResource(formData: FormData) {
  const user = await requireAdmin();
  const data = z.object({
    id: z.string().optional(),
    title: z.string().min(3),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    categoryId: z.string().min(1),
    excerpt: z.string().min(10),
    body: z.string().min(20),
    coverImage: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    status: z.nativeEnum(PublishStatus)
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    title: text(formData.get("title")),
    slug: text(formData.get("slug")),
    categoryId: text(formData.get("categoryId")),
    excerpt: text(formData.get("excerpt")),
    body: text(formData.get("body")),
    coverImage: text(formData.get("coverImage")),
    seoTitle: text(formData.get("seoTitle")),
    seoDescription: text(formData.get("seoDescription")),
    status: status(formData.get("status"))
  });
  const articleData = {
    ...data,
    id: undefined,
    coverImage: data.coverImage || null,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    publishedAt: data.status === PublishStatus.PUBLISHED ? new Date() : null,
    authorId: user.id
  };
  const article = data.id
    ? await prisma.resourceArticle.update({ where: { id: data.id }, data: articleData })
    : await prisma.resourceArticle.create({ data: articleData });
  refresh("/", "/resources", `/resources/${article.slug}`, "/admin/resources");
  redirect("/admin/resources");
}

export async function deleteResource(formData: FormData) {
  await requireAdmin();
  await prisma.resourceArticle.delete({ where: { id: z.string().parse(formData.get("id")) } });
  refresh("/", "/resources", "/admin/resources");
}

export async function saveProject(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string().optional(),
    title: z.string().min(3),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    clientName: z.string().optional(),
    location: z.string().min(2),
    projectType: z.string().min(2),
    capacityKw: z.coerce.number().nonnegative(),
    commissionedAt: z.string().optional(),
    coverImage: z.string().optional(),
    summary: z.string().min(10),
    fullCaseStudy: z.string().min(20),
    inverterBrandModel: z.string().optional(),
    moduleBrandModel: z.string().optional(),
    videoUrl: z.string().optional(),
    status: z.nativeEnum(PublishStatus)
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    title: text(formData.get("title")),
    slug: text(formData.get("slug")),
    clientName: text(formData.get("clientName")),
    location: text(formData.get("location")),
    projectType: text(formData.get("projectType")),
    capacityKw: text(formData.get("capacityKw")),
    commissionedAt: text(formData.get("commissionedAt")),
    coverImage: text(formData.get("coverImage")),
    summary: text(formData.get("summary")),
    fullCaseStudy: text(formData.get("fullCaseStudy")),
    inverterBrandModel: text(formData.get("inverterBrandModel")),
    moduleBrandModel: text(formData.get("moduleBrandModel")),
    videoUrl: text(formData.get("videoUrl")),
    status: status(formData.get("status"))
  });
  const projectData = {
    ...data,
    id: undefined,
    clientName: data.clientName || null,
    commissionedAt: data.commissionedAt ? new Date(data.commissionedAt) : null,
    coverImage: data.coverImage || null,
    inverterBrandModel: data.inverterBrandModel || null,
    moduleBrandModel: data.moduleBrandModel || null,
    videoUrl: data.videoUrl || null,
    imageUrls: lines(formData.get("imageUrls"))
  };
  if (data.id) await prisma.project.update({ where: { id: data.id }, data: projectData });
  else await prisma.project.create({ data: projectData });
  refresh("/", "/admin/projects");
  redirect("/admin/projects");
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  await prisma.project.delete({ where: { id: z.string().parse(formData.get("id")) } });
  refresh("/", "/admin/projects");
}

export async function saveSiteContent(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    key: z.string().min(2),
    title: z.string().min(2),
    body: z.string().min(10),
    status: z.nativeEnum(PublishStatus)
  }).parse({
    key: text(formData.get("key")),
    title: text(formData.get("title")),
    body: text(formData.get("body")),
    status: status(formData.get("status"))
  });
  await prisma.siteContent.upsert({ where: { key: data.key }, update: data, create: data });
  refresh("/", "/admin/content");
}

export async function saveImpact(formData: FormData) {
  const user = await requireAdmin();
  const data = z.object({
    plantsInOperation: z.coerce.number().int().nonnegative(),
    totalInstalledCapacityKw: z.coerce.number().nonnegative(),
    kwhGenerated: z.coerce.number().nonnegative(),
    equivalentTreesPlanted: z.coerce.number().nonnegative(),
    co2OffsetTons: z.coerce.number().nonnegative(),
    longHaulFlightsAvoided: z.coerce.number().nonnegative()
  }).parse(Object.fromEntries(formData));
  const latest = await prisma.impactSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  const payload = {
    ...data,
    manualBaselineJson: {
      updatedBy: user.email,
      updatedAt: new Date().toISOString(),
      baseline: {
        kwhGenerated: data.kwhGenerated,
        co2OffsetTons: data.co2OffsetTons,
        equivalentTreesPlanted: data.equivalentTreesPlanted,
        longHaulFlightsAvoided: data.longHaulFlightsAvoided
      }
    },
    lastCalculatedAt: new Date()
  };
  if (latest) await prisma.impactSnapshot.update({ where: { id: latest.id }, data: payload });
  else await prisma.impactSnapshot.create({ data: payload });
  refresh("/", "/admin/impact", "/api/impact");
}

export async function saveSeo(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string().optional(),
    route: z.string().min(1),
    title: z.string().min(3),
    description: z.string().min(10),
    ogImage: z.string().optional()
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    route: text(formData.get("route")),
    title: text(formData.get("title")),
    description: text(formData.get("description")),
    ogImage: text(formData.get("ogImage"))
  });
  const payload = {
    route: data.route,
    title: data.title,
    description: data.description,
    ogImage: data.ogImage || null,
    keywords: text(formData.get("keywords")).split(",").map((item) => item.trim()).filter(Boolean)
  };
  await prisma.seoMetadata.upsert({ where: { route: data.route }, update: payload, create: payload });
  refresh("/", "/admin/seo");
  redirect("/admin/seo");
}

export async function deleteSeo(formData: FormData) {
  await requireAdmin();
  await prisma.seoMetadata.delete({ where: { id: z.string().parse(formData.get("id")) } });
  refresh("/admin/seo");
}

export async function markContactRead(formData: FormData) {
  await requireAdmin();
  await prisma.contactSubmission.update({
    where: { id: z.string().parse(formData.get("id")) },
    data: { isRead: text(formData.get("isRead")) === "true" }
  });
  refresh("/admin/contacts");
}

export async function deleteContact(formData: FormData) {
  await requireAdmin();
  await prisma.contactSubmission.delete({ where: { id: z.string().parse(formData.get("id")) } });
  refresh("/admin/contacts");
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string().min(1),
    status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "REFUNDED"])
  }).parse({ id: text(formData.get("id")), status: text(formData.get("status")) });
  await prisma.order.update({ where: { id: data.id }, data: { status: data.status } });
  refresh("/admin/orders");
}
