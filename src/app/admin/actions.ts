"use server";

import { IntegrationProvider, OrderStatus, PageKey, PaymentStatus, PublishStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deletePublicUpload, getFiles, saveUpload, uploadRules } from "@/lib/uploads";
import { sendOrderNotifications } from "@/lib/notifications";
import { getDatasetStats, searchBangladeshLocation } from "@/lib/bangladesh-location-service";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) throw new Error("Unauthorized");
  return session.user;
}

async function requirePagePermission(action: string) {
  const user = await requireAdmin();
  if (user.role === "SUPER_ADMIN") return user;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { appRole: { include: { permissions: true } } }
  });
  const allowed = dbUser?.appRole?.permissions.some((permission) => permission.module === "Pages" && permission.action === action);
  if (!allowed) throw new Error("Unauthorized");
  return user;
}

const text = (value: FormDataEntryValue | null) => String(value ?? "").trim();
const optional = (value: FormDataEntryValue | null) => text(value) || null;
const status = (value: FormDataEntryValue | null) =>
  z.nativeEnum(PublishStatus).parse(text(value) || PublishStatus.DRAFT);
const lines = (value: FormDataEntryValue | null) =>
  text(value).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

function parseJson(value: FormDataEntryValue | null) {
  const raw = text(value);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Settings JSON must be valid JSON.");
  }
}

function refresh(...paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

function productError(message: string, productId?: string): never {
  const target = `/admin/products?error=${encodeURIComponent(message)}${productId ? `&edit=${productId}` : ""}`;
  redirect(target);
}

function slugifyProduct(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `product-${Date.now()}`;
}

function firstProductValidationMessage(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors;
  const labels: Record<string, string> = {
    name: "Product name is required.",
    sku: "SKU/model is required.",
    brand: "Brand / manufacturer is required.",
    categoryId: "Category is required.",
    priceBdt: "Price must be a valid number greater than or equal to 0.",
    stockQuantity: "Stock quantity must be a valid whole number greater than or equal to 0.",
    shortDescription: "Short description is required.",
    technicalDescription: "Full description must be valid text.",
    status: "Product status is required."
  };
  const field = Object.keys(flattened).find((key) => flattened[key as keyof typeof flattened]?.length);
  return field ? labels[field] ?? flattened[field as keyof typeof flattened]?.[0] ?? "Please check the highlighted product field." : "Please check the product form values.";
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    sku: z.string().min(2),
    model: z.string().optional(),
    brand: z.string().min(1),
    categoryId: z.string().min(1),
    priceBdt: z.coerce.number().nonnegative(),
    stockQuantity: z.coerce.number().int().nonnegative(),
    shortDescription: z.string().min(10),
    technicalDescription: z.string().optional(),
    warrantyNote: z.string().optional(),
    stockStatus: z.string().optional(),
    datasheetUrl: z.string().optional(),
    manualUrl: z.string().optional(),
    status: z.nativeEnum(PublishStatus)
  });
  const productId = optional(formData.get("id")) ?? undefined;
  const uploadedFiles = getFiles(formData, "productImages");
  let data: z.infer<typeof schema>;
  try {
    data = schema.parse({
    id: optional(formData.get("id")) ?? undefined,
    name: text(formData.get("name")),
    sku: text(formData.get("sku")),
    model: text(formData.get("model")),
    brand: text(formData.get("brand")),
    categoryId: text(formData.get("categoryId")),
    priceBdt: text(formData.get("priceBdt")),
    stockQuantity: text(formData.get("stockQuantity")),
    shortDescription: text(formData.get("shortDescription")),
    technicalDescription: text(formData.get("technicalDescription")),
    warrantyNote: text(formData.get("warrantyNote")),
    stockStatus: text(formData.get("stockStatus")),
    datasheetUrl: text(formData.get("datasheetUrl")),
    manualUrl: text(formData.get("manualUrl")),
    status: status(formData.get("status"))
    });
  } catch (error) {
    productError(error instanceof z.ZodError ? firstProductValidationMessage(error) : "Please check the product form values.", productId);
  }

  const existingImages = data.id
    ? await prisma.productImage.findMany({ where: { productId: data.id }, orderBy: { sortOrder: "asc" } })
    : [];
  const deletedIds = new Set(formData.getAll("deleteImageId").map(String));
  const keptImages = existingImages.filter((image) => !deletedIds.has(image.id));
  if (keptImages.length + uploadedFiles.length < 1) {
    productError("Please upload at least one product image.", data.id);
  }

  for (const file of uploadedFiles) {
    if (!uploadRules.productImage.allowedTypes.has(file.type)) {
      productError("Only JPG, JPEG, PNG and WebP product images are allowed.", data.id);
    }
    if (file.size > uploadRules.productImage.maxBytes) {
      productError("Each product image must be 2 MB or smaller.", data.id);
    }
  }

  const datasheetFile = getFiles(formData, "datasheetFile")[0];
  const manualFile = getFiles(formData, "manualFile")[0];
  let datasheetUrl = data.datasheetUrl || null;
  let manualUrl = data.manualUrl || null;
  try {
    if (datasheetFile) datasheetUrl = (await saveUpload(datasheetFile, { kind: "datasheets", fallbackName: "datasheet", ...uploadRules.datasheet })).url;
    if (manualFile) manualUrl = (await saveUpload(manualFile, { kind: "datasheets", fallbackName: "manual", ...uploadRules.datasheet })).url;
  } catch (error) {
    productError(error instanceof Error ? error.message : "Datasheet/manual upload failed.", data.id);
  }

  const existingProduct = data.id ? await prisma.product.findUnique({ where: { id: data.id } }) : null;
  const modelOrSku = data.model || data.sku;
  const baseSlug = slugifyProduct(`${data.name} ${modelOrSku}`);
  const slug = existingProduct?.slug ?? baseSlug;
  const specifications = data.stockStatus ? { availability: data.stockStatus } : {};
  const productData = {
    name: data.name,
    slug,
    sku: data.sku,
    model: modelOrSku,
    brand: data.brand,
    categoryId: data.categoryId,
    priceBdt: data.priceBdt,
    stockQuantity: data.stockQuantity,
    shortDescription: data.shortDescription,
    technicalDescription: data.technicalDescription || data.shortDescription,
    keyFeatures: [],
    warrantyNote: data.warrantyNote || null,
    supportNote: null,
    specifications,
    datasheetUrl,
    manualUrl,
    isFeatured: formData.get("isFeatured") === "on",
    status: data.status
  };
  let product;
  try {
    product = data.id
      ? await prisma.product.update({ where: { id: data.id }, data: productData })
      : await prisma.product.create({ data: productData });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique constraint")
      ? "A product with this SKU/model or generated slug already exists."
      : "Product could not be saved. Please check the form values.";
    productError(message, data.id);
  }

  const imagesToDelete = existingImages.filter((image) => deletedIds.has(image.id));
  if (imagesToDelete.length) {
    await prisma.productImage.deleteMany({ where: { id: { in: imagesToDelete.map((image) => image.id) } } });
    await Promise.all(imagesToDelete.map((image) => deletePublicUpload(image.imagePath)));
  }

  const primaryImage = text(formData.get("primaryImage"));
  await Promise.all(
    keptImages.map((image) =>
      prisma.productImage.update({
        where: { id: image.id },
        data: {
          altText: text(formData.get(`imageAlt_${image.id}`)) || product.name,
          sortOrder: Number(text(formData.get(`imageSort_${image.id}`)) || image.sortOrder),
          isPrimary: primaryImage === image.id
        }
      })
    )
  );

  const createdImages = [];
  for (const [index, file] of uploadedFiles.entries()) {
    try {
      const saved = await saveUpload(file, { kind: "products", fallbackName: "product", ...uploadRules.productImage });
      createdImages.push(await prisma.productImage.create({
        data: {
          productId: product.id,
          imagePath: saved.url,
          altText: product.name,
          sortOrder: keptImages.length + index,
          isPrimary: primaryImage === `new-${index}` || (!primaryImage && keptImages.length === 0 && index === 0)
        }
      }));
    } catch (error) {
      productError(error instanceof Error ? error.message : "Product image upload failed.", product.id);
    }
  }

  const finalImages = await prisma.productImage.findMany({ where: { productId: product.id }, orderBy: { sortOrder: "asc" } });
  if (finalImages.length && !finalImages.some((image) => image.isPrimary)) {
    const firstCreatedPrimary = createdImages.find((image) => image.isPrimary);
    await prisma.productImage.update({
      where: { id: firstCreatedPrimary?.id ?? finalImages[0].id },
      data: { isPrimary: true }
    });
  }
  refresh("/", "/shop", `/shop/${product.slug}`, "/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = z.string().parse(formData.get("id"));
  const images = await prisma.productImage.findMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  await Promise.all(images.map((image) => deletePublicUpload(image.imagePath)));
  refresh("/", "/shop", "/admin/products");
}

export async function saveProductCategory(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    parentId: z.string().optional(),
    icon: z.string().optional(),
    sortOrder: z.coerce.number().int().default(0),
    status: z.nativeEnum(PublishStatus)
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    name: text(formData.get("name")),
    slug: text(formData.get("slug")),
    description: text(formData.get("description")),
    parentId: text(formData.get("parentId")),
    icon: text(formData.get("icon")),
    sortOrder: text(formData.get("sortOrder")) || "0",
    status: status(formData.get("status"))
  });
  const payload = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    parentId: data.parentId && data.parentId !== data.id ? data.parentId : null,
    icon: data.icon || null,
    sortOrder: data.sortOrder,
    status: data.status
  };
  if (data.id) await prisma.productCategory.update({ where: { id: data.id }, data: payload });
  else await prisma.productCategory.create({ data: payload });
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
    coverImageAlt: z.string().optional(),
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
    coverImageAlt: text(formData.get("coverImageAlt")),
    seoTitle: text(formData.get("seoTitle")),
    seoDescription: text(formData.get("seoDescription")),
    status: status(formData.get("status"))
  });
  const existing = data.id ? await prisma.resourceArticle.findUnique({ where: { id: data.id } }) : null;
  const imageFile = getFiles(formData, "coverImageFile")[0];
  let coverImage = data.coverImage || existing?.coverImage || null;
  try {
    if (imageFile) {
      const saved = await saveUpload(imageFile, { kind: "resources", fallbackName: "resource", ...uploadRules.adminImage });
      if (existing?.coverImage) await deletePublicUpload(existing.coverImage);
      coverImage = saved.url;
    }
  } catch (error) {
    redirect(`/admin/resources?error=${encodeURIComponent(error instanceof Error ? error.message : "Resource image upload failed.")}${data.id ? `&edit=${data.id}` : ""}`);
  }

  if (formData.get("deleteCoverImage") === "on") {
    if (existing?.coverImage) await deletePublicUpload(existing.coverImage);
    coverImage = null;
  }

  const articleData = {
    ...data,
    id: undefined,
    coverImage,
    coverImageAlt: data.coverImageAlt || null,
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
  const id = z.string().parse(formData.get("id"));
  const article = await prisma.resourceArticle.findUnique({ where: { id } });
  await prisma.resourceArticle.delete({ where: { id } });
  await deletePublicUpload(article?.coverImage);
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
  const existingImages = data.id
    ? await prisma.projectImage.findMany({ where: { projectId: data.id }, orderBy: { sortOrder: "asc" } })
    : [];
  const deletedIds = new Set(formData.getAll("deleteProjectImageId").map(String));
  const keptImages = existingImages.filter((image) => !deletedIds.has(image.id));
  const uploadedFiles = getFiles(formData, "projectImages");
  for (const file of uploadedFiles) {
    if (!uploadRules.adminImage.allowedTypes.has(file.type)) redirect(`/admin/projects?error=${encodeURIComponent("Only JPG, JPEG, PNG and WebP project images are allowed.")}${data.id ? `&edit=${data.id}` : ""}`);
    if (file.size > uploadRules.adminImage.maxBytes) redirect(`/admin/projects?error=${encodeURIComponent("Each project image must be 3 MB or smaller.")}${data.id ? `&edit=${data.id}` : ""}`);
  }

  const projectData = {
    ...data,
    id: undefined,
    clientName: data.clientName || null,
    commissionedAt: data.commissionedAt ? new Date(data.commissionedAt) : null,
    coverImage: data.coverImage || keptImages.find((image) => image.isPrimary)?.imagePath || keptImages[0]?.imagePath || null,
    inverterBrandModel: data.inverterBrandModel || null,
    moduleBrandModel: data.moduleBrandModel || null,
    videoUrl: data.videoUrl || null,
    imageUrls: lines(formData.get("imageUrls"))
  };
  const project = data.id
    ? await prisma.project.update({ where: { id: data.id }, data: projectData })
    : await prisma.project.create({ data: projectData });

  const imagesToDelete = existingImages.filter((image) => deletedIds.has(image.id));
  if (imagesToDelete.length) {
    await prisma.projectImage.deleteMany({ where: { id: { in: imagesToDelete.map((image) => image.id) } } });
    await Promise.all(imagesToDelete.map((image) => deletePublicUpload(image.imagePath)));
  }

  const primaryImage = text(formData.get("primaryProjectImage"));
  await Promise.all(
    keptImages.map((image) =>
      prisma.projectImage.update({
        where: { id: image.id },
        data: {
          altText: text(formData.get(`projectImageAlt_${image.id}`)) || project.title,
          sortOrder: Number(text(formData.get(`projectImageSort_${image.id}`)) || image.sortOrder),
          isPrimary: primaryImage === image.id
        }
      })
    )
  );

  for (const [index, file] of uploadedFiles.entries()) {
    try {
      const saved = await saveUpload(file, { kind: "projects", fallbackName: "project", ...uploadRules.adminImage });
      await prisma.projectImage.create({
        data: {
          projectId: project.id,
          imagePath: saved.url,
          altText: project.title,
          sortOrder: keptImages.length + index,
          isPrimary: primaryImage === `new-project-${index}` || (!primaryImage && keptImages.length === 0 && index === 0)
        }
      });
    } catch (error) {
      redirect(`/admin/projects?error=${encodeURIComponent(error instanceof Error ? error.message : "Project image upload failed.")}&edit=${project.id}`);
    }
  }

  const finalImages = await prisma.projectImage.findMany({ where: { projectId: project.id }, orderBy: { sortOrder: "asc" } });
  const primary = finalImages.find((image) => image.isPrimary) ?? finalImages[0];
  if (primary) {
    if (!primary.isPrimary) await prisma.projectImage.update({ where: { id: primary.id }, data: { isPrimary: true } });
    await prisma.project.update({ where: { id: project.id }, data: { coverImage: primary.imagePath } });
  }
  refresh("/", "/admin/projects");
  redirect("/admin/projects");
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  const id = z.string().parse(formData.get("id"));
  const images = await prisma.projectImage.findMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });
  await Promise.all(images.map((image) => deletePublicUpload(image.imagePath)));
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

export async function saveFooterSettings(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    contactEmail: z.string().email("Enter a valid contact email."),
    contactPhone: z.string().min(6, "Enter a valid phone number."),
    address: z.string().min(3, "Enter the footer address."),
    facebookUrl: z.string().url("Enter a valid Facebook URL.").or(z.literal("")).optional(),
    linkedinUrl: z.string().url("Enter a valid LinkedIn URL.").or(z.literal("")).optional(),
    youtubeUrl: z.string().url("Enter a valid YouTube URL.").or(z.literal("")).optional(),
    whatsappNumber: z.string().optional(),
    footerDescription: z.string().min(20, "Footer description should be at least 20 characters."),
    copyrightText: z.string().min(5, "Enter copyright text.")
  }).parse({
    contactEmail: text(formData.get("contactEmail")),
    contactPhone: text(formData.get("contactPhone")),
    address: text(formData.get("address")),
    facebookUrl: text(formData.get("facebookUrl")),
    linkedinUrl: text(formData.get("linkedinUrl")),
    youtubeUrl: text(formData.get("youtubeUrl")),
    whatsappNumber: text(formData.get("whatsappNumber")),
    footerDescription: text(formData.get("footerDescription")),
    copyrightText: text(formData.get("copyrightText"))
  });
  await prisma.siteSettings.upsert({
    where: { singletonKey: "footer" },
    update: data,
    create: { singletonKey: "footer", ...data }
  });
  refresh("/", "/thermal", "/shop", "/resources", "/admin/site-settings/footer");
  redirect("/admin/site-settings/footer?saved=1");
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
  const user = await requireAdmin();
  const data = z.object({
    id: z.string().min(1),
    status: z.nativeEnum(OrderStatus),
    note: z.string().optional()
  }).parse({ id: text(formData.get("id")), status: text(formData.get("status")), note: text(formData.get("note")) });
  const current = await prisma.order.findUnique({ where: { id: data.id } });
  if (!current) throw new Error("Order not found.");
  const paymentStatus = data.status === OrderStatus.PAYMENT_CLEARED ? PaymentStatus.PAYMENT_CLEARED : current.paymentStatus;
  await prisma.$transaction([
    prisma.order.update({
      where: { id: data.id },
      data: {
        status: data.status,
        paymentStatus,
        notes: data.note ? [current.notes, data.note].filter(Boolean).join("\n\n") : current.notes
      }
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: data.id,
        fromStatus: current.status,
        toStatus: data.status,
        paymentStatus,
        note: data.note || null,
        changedByUserId: user.id || null
      }
    })
  ]);
  refresh("/admin/orders");
}

export async function updateOrderPaymentStatus(formData: FormData) {
  const user = await requireAdmin();
  const data = z.object({
    id: z.string().min(1),
    paymentStatus: z.nativeEnum(PaymentStatus),
    note: z.string().optional()
  }).parse({ id: text(formData.get("id")), paymentStatus: text(formData.get("paymentStatus")), note: text(formData.get("note")) });
  const current = await prisma.order.findUnique({ where: { id: data.id } });
  if (!current) throw new Error("Order not found.");
  const nextOrderStatus = data.paymentStatus === PaymentStatus.PAYMENT_CLEARED ? OrderStatus.PAYMENT_CLEARED : current.status;
  await prisma.$transaction([
    prisma.order.update({
      where: { id: data.id },
      data: {
        paymentStatus: data.paymentStatus,
        status: nextOrderStatus,
        notes: data.note ? [current.notes, data.note].filter(Boolean).join("\n\n") : current.notes
      }
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: data.id,
        fromStatus: current.status,
        toStatus: nextOrderStatus,
        paymentStatus: data.paymentStatus,
        note: data.note || null,
        changedByUserId: user.id || null
      }
    })
  ]);
  refresh("/admin/orders");
}

export async function addOrderInternalNote(formData: FormData) {
  const user = await requireAdmin();
  const data = z.object({
    id: z.string().min(1),
    note: z.string().min(1)
  }).parse({ id: text(formData.get("id")), note: text(formData.get("note")) });
  const current = await prisma.order.findUnique({ where: { id: data.id } });
  if (!current) throw new Error("Order not found.");
  await prisma.$transaction([
    prisma.order.update({
      where: { id: data.id },
      data: { notes: [current.notes, data.note].filter(Boolean).join("\n\n") }
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: data.id,
        fromStatus: current.status,
        toStatus: current.status,
        paymentStatus: current.paymentStatus,
        note: data.note,
        changedByUserId: user.id || null
      }
    })
  ]);
  refresh("/admin/orders");
}

export async function resendOrderNotifications(formData: FormData) {
  await requireAdmin();
  const id = z.string().parse(formData.get("id"));
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new Error("Order not found");
  await sendOrderNotifications(order);
  refresh("/admin/orders");
}

export async function saveDeliverySettings(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    courierMinimumChargeBdt: z.coerce.number().nonnegative(),
    pickupLabel: z.string().min(2),
    pickupAddress: z.string().min(2),
    courierEnabled: z.boolean(),
    pickupEnabled: z.boolean()
  }).parse({
    courierMinimumChargeBdt: text(formData.get("courierMinimumChargeBdt")) || "200",
    pickupLabel: text(formData.get("pickupLabel")),
    pickupAddress: text(formData.get("pickupAddress")),
    courierEnabled: formData.get("courierEnabled") === "on",
    pickupEnabled: formData.get("pickupEnabled") === "on"
  });
  await prisma.ecommerceDeliverySetting.upsert({
    where: { singletonKey: "default" },
    update: data,
    create: { singletonKey: "default", ...data }
  });
  refresh("/checkout", "/admin/settings/delivery");
  redirect("/admin/settings/delivery?saved=1");
}

export async function saveMessagingIntegration(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    providerName: z.string().min(2),
    baseUrl: z.string().optional(),
    apiKey: z.string().optional(),
    senderId: z.string().optional(),
    otpTemplate: z.string().min(10),
    orderConfirmationTemplate: z.string().min(10),
    isEnabled: z.boolean()
  }).parse({
    providerName: text(formData.get("providerName")),
    baseUrl: text(formData.get("baseUrl")),
    apiKey: text(formData.get("apiKey")),
    senderId: text(formData.get("senderId")),
    otpTemplate: text(formData.get("otpTemplate")),
    orderConfirmationTemplate: text(formData.get("orderConfirmationTemplate")),
    isEnabled: formData.get("isEnabled") === "on"
  });
  const existing = await prisma.messagingIntegration.findUnique({ where: { singletonKey: "default" } });
  await prisma.messagingIntegration.upsert({
    where: { singletonKey: "default" },
    update: { ...data, apiKey: data.apiKey || existing?.apiKey || null },
    create: { singletonKey: "default", ...data, apiKey: data.apiKey || null }
  });
  refresh("/admin/integrations/messaging");
  redirect("/admin/integrations/messaging?saved=1");
}

export async function testMessagingIntegration(formData: FormData) {
  await requireAdmin();
  const mobile = text(formData.get("testMobile"));
  await prisma.messagingIntegration.upsert({
    where: { singletonKey: "default" },
    update: {
      lastTestAt: new Date(),
      lastTestStatus: mobile ? `Test queued for ${mobile}. Provider adapter is not configured in this environment.` : "Enter a test mobile number."
    },
    create: {
      singletonKey: "default",
      providerName: "Not configured",
      lastTestAt: new Date(),
      lastTestStatus: "Messaging provider is not configured."
    }
  });
  refresh("/admin/integrations/messaging");
}

export async function saveLocationDatasetSettings(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    cacheDurationMinutes: z.coerce.number().int().min(1).max(10080)
  }).parse({
    cacheDurationMinutes: text(formData.get("cacheDurationMinutes")) || "1440"
  });
  await prisma.locationDatasetSetting.upsert({
    where: { singletonKey: "default" },
    update: {
      providerName: "bangladesh-geojson",
      providerType: "Local package/data",
      cacheDurationMinutes: data.cacheDurationMinutes
    },
    create: {
      singletonKey: "default",
      providerName: "bangladesh-geojson",
      providerType: "Local package/data",
      cacheDurationMinutes: data.cacheDurationMinutes
    }
  });
  refresh("/checkout", "/admin/integrations/location-api");
  redirect("/admin/integrations/location-api?saved=1");
}

export async function testLocationDataset(formData: FormData) {
  await requireAdmin();
  const query = text(formData.get("testQuery")) || "Dhaka";
  try {
    const stats = getDatasetStats();
    const results = searchBangladeshLocation(query);
    const message = `Installed. ${stats.divisions} divisions, ${stats.districts} districts, ${stats.upazilas} upazilas, ${stats.postcodes} postcodes. Search "${query}" returned ${results.length} result(s).`;
    await prisma.locationDatasetSetting.upsert({
      where: { singletonKey: "default" },
      update: {
        providerName: "bangladesh-geojson",
        providerType: "Local package/data",
        lastTestAt: new Date(),
        lastTestStatus: message,
        lastErrorMessage: null,
        lastSearchQuery: query,
        lastSearchResultCount: results.length
      },
      create: {
        singletonKey: "default",
        providerName: "bangladesh-geojson",
        providerType: "Local package/data",
        lastTestAt: new Date(),
        lastTestStatus: message,
        lastSearchQuery: query,
        lastSearchResultCount: results.length
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Location dataset test failed.";
    await prisma.locationDatasetSetting.upsert({
      where: { singletonKey: "default" },
      update: { lastTestAt: new Date(), lastTestStatus: "Failed", lastErrorMessage: message },
      create: {
        singletonKey: "default",
        providerName: "bangladesh-geojson",
        providerType: "Local package/data",
        lastTestAt: new Date(),
        lastTestStatus: "Failed",
        lastErrorMessage: message
      }
    });
  }
  refresh("/admin/integrations/location-api");
}

export async function refreshLocationDatasetCache() {
  await requireAdmin();
  const stats = getDatasetStats();
  await prisma.locationDatasetSetting.upsert({
    where: { singletonKey: "default" },
    update: {
      providerName: "bangladesh-geojson",
      providerType: "Local package/data",
      lastTestAt: new Date(),
      lastTestStatus: `Local dataset cache refreshed. ${stats.divisions} divisions, ${stats.districts} districts, ${stats.upazilas} upazilas, ${stats.postcodes} postcodes.`,
      lastErrorMessage: null
    },
    create: {
      singletonKey: "default",
      providerName: "bangladesh-geojson",
      providerType: "Local package/data",
      lastTestAt: new Date(),
      lastTestStatus: `Local dataset cache refreshed. ${stats.divisions} divisions, ${stats.districts} districts, ${stats.upazilas} upazilas, ${stats.postcodes} postcodes.`
    }
  });
  refresh("/admin/integrations/location-api");
}

export async function saveHeroMedia(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string().optional(),
    pageKey: z.nativeEnum(PageKey),
    title: z.string().min(2),
    mediaType: z.enum(["image", "video"]),
    url: z.string().optional(),
    altText: z.string().min(2),
    sortOrder: z.coerce.number().int().default(0),
    isPublished: z.boolean(),
    isPrimary: z.boolean()
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    pageKey: text(formData.get("pageKey")) || PageKey.epc,
    title: text(formData.get("title")),
    mediaType: text(formData.get("mediaType")),
    url: text(formData.get("url")),
    altText: text(formData.get("altText")),
    sortOrder: text(formData.get("sortOrder")),
    isPublished: formData.get("isPublished") === "on",
    isPrimary: formData.get("isPrimary") === "on"
  });

  const existing = data.id ? await prisma.heroMedia.findUnique({ where: { id: data.id } }) : null;
  const file = getFiles(formData, "mediaFile")[0];
  const posterFile = getFiles(formData, "posterFile")[0];
  let filePath = data.url || existing?.filePath || existing?.url || "";
  let posterImagePath = existing?.posterImagePath ?? null;
  let mimeType = existing?.mimeType ?? null;
  let fileSize = existing?.fileSize ?? null;
  if (file) {
    const rules = data.mediaType === "video" ? uploadRules.heroVideo : uploadRules.adminImage;
    try {
      const saved = await saveUpload(file, { kind: "hero", subdir: data.pageKey, fallbackName: `${data.pageKey}-hero-media`, ...rules });
      await deleteUniqueUploads(existing?.filePath, existing?.url);
      filePath = saved.url;
      mimeType = saved.mimeType;
      fileSize = saved.size;
    } catch (error) {
      redirect(`/admin/hero-media?pageKey=${data.pageKey}&error=${encodeURIComponent(error instanceof Error ? error.message : "Hero media upload failed.")}${data.id ? `&edit=${data.id}` : ""}`);
    }
  }
  if (posterFile) {
    try {
      const savedPoster = await saveUpload(posterFile, { kind: "hero", subdir: data.pageKey, fallbackName: `${data.pageKey}-hero-poster`, ...uploadRules.adminImage });
      await deletePublicUpload(existing?.posterImagePath);
      posterImagePath = savedPoster.url;
    } catch (error) {
      redirect(`/admin/hero-media?pageKey=${data.pageKey}&error=${encodeURIComponent(error instanceof Error ? error.message : "Poster upload failed.")}${data.id ? `&edit=${data.id}` : ""}`);
    }
  }
  if (!filePath) redirect(`/admin/hero-media?pageKey=${data.pageKey}&error=${encodeURIComponent("Upload a file or provide a media URL.")}${data.id ? `&edit=${data.id}` : ""}`);

  const payload = {
    pageKey: data.pageKey,
    title: data.title,
    mediaType: data.mediaType,
    url: filePath,
    filePath,
    posterImagePath,
    alt: data.altText,
    altText: data.altText,
    sortOrder: data.sortOrder,
    isPrimary: data.isPrimary,
    isPublished: data.isPublished,
    status: data.isPublished ? PublishStatus.PUBLISHED : PublishStatus.UNPUBLISHED,
    mimeType,
    fileSize
  };
  const media = data.id
    ? await prisma.heroMedia.update({ where: { id: data.id }, data: payload })
    : await prisma.heroMedia.create({ data: payload });
  if (payload.isPrimary) {
    await prisma.heroMedia.updateMany({ where: { pageKey: data.pageKey, id: { not: media.id } }, data: { isPrimary: false } });
  }
  refresh(heroPagePath(data.pageKey), "/admin/hero-media");
  redirect(`/admin/hero-media?pageKey=${data.pageKey}`);
}

export async function deleteHeroMedia(formData: FormData) {
  await requireAdmin();
  const id = z.string().parse(formData.get("id"));
  const media = await prisma.heroMedia.findUnique({ where: { id } });
  await prisma.heroMedia.delete({ where: { id } });
  await deleteUniqueUploads(media?.filePath, media?.url, media?.posterImagePath);
  refresh(media ? heroPagePath(media.pageKey) : "/", "/admin/hero-media");
}

async function deleteUniqueUploads(...urls: Array<string | null | undefined>) {
  for (const url of Array.from(new Set(urls.filter(Boolean)))) {
    await deletePublicUpload(url);
  }
}

function heroPagePath(pageKey: PageKey) {
  if (pageKey === PageKey.epc) return "/";
  return `/${pageKey}`;
}

export async function saveIntegration(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string().optional(),
    label: z.string().min(2),
    provider: z.nativeEnum(IntegrationProvider),
    baseUrl: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    plantMapping: z.string().optional(),
    syncFrequencyMinutes: z.coerce.number().int().positive(),
    isEnabled: z.boolean()
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    label: text(formData.get("label")),
    provider: text(formData.get("provider")),
    baseUrl: text(formData.get("baseUrl")),
    apiKey: text(formData.get("apiKey")),
    apiSecret: text(formData.get("apiSecret")),
    username: text(formData.get("username")),
    password: text(formData.get("password")),
    plantMapping: text(formData.get("plantMapping")),
    syncFrequencyMinutes: text(formData.get("syncFrequencyMinutes")) || "1440",
    isEnabled: formData.get("isEnabled") === "on"
  });
  const existing = data.id ? await prisma.monitoringIntegration.findUnique({ where: { id: data.id } }) : null;
  const payload = {
    label: data.label,
    provider: data.provider,
    baseUrl: data.baseUrl || null,
    apiKey: data.apiKey || existing?.apiKey || null,
    apiSecret: data.apiSecret || existing?.apiSecret || null,
    username: data.username || existing?.username || null,
    password: data.password || existing?.password || null,
    plantMapping: data.plantMapping || null,
    syncFrequencyMinutes: data.syncFrequencyMinutes,
    isEnabled: data.isEnabled
  };
  if (data.id) await prisma.monitoringIntegration.update({ where: { id: data.id }, data: payload });
  else await prisma.monitoringIntegration.create({ data: payload });
  refresh("/admin/integrations");
  redirect("/admin/integrations");
}

export async function deleteIntegration(formData: FormData) {
  await requireAdmin();
  await prisma.monitoringIntegration.delete({ where: { id: z.string().parse(formData.get("id")) } });
  refresh("/admin/integrations");
}

export async function testIntegration(formData: FormData) {
  await requireAdmin();
  const id = z.string().parse(formData.get("id"));
  await prisma.monitoringIntegration.update({
    where: { id },
    data: {
      lastSyncAt: new Date(),
      lastSyncStatus: "Test unavailable",
      lastSyncMessage: "Connection testing is safely stubbed until provider-specific credentials and endpoints are configured.",
      errorLog: null
    }
  });
  refresh("/admin/integrations");
}

export async function manualSyncIntegration(formData: FormData) {
  await requireAdmin();
  const id = z.string().parse(formData.get("id"));
  await prisma.monitoringIntegration.update({
    where: { id },
    data: {
      lastSyncAt: new Date(),
      lastSyncStatus: "Sync skipped",
      lastSyncMessage: "Manual sync is ready for provider adapters. No impact baseline values were overwritten.",
      errorLog: null
    }
  });
  refresh("/admin/integrations");
}

export async function saveUser(formData: FormData) {
  const actor = await requireAdmin();
  if (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN") throw new Error("Unauthorized");
  const data = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.nativeEnum(Role),
    appRoleId: z.string().optional(),
    password: z.string().optional(),
    isActive: z.boolean()
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    name: text(formData.get("name")),
    email: text(formData.get("email")),
    phone: text(formData.get("phone")),
    role: text(formData.get("role")) || Role.ADMIN,
    appRoleId: text(formData.get("appRoleId")),
    password: text(formData.get("password")),
    isActive: formData.get("isActive") === "on"
  });
  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined;
  const payload = {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    role: data.role,
    appRoleId: data.appRoleId || null,
    isActive: data.isActive,
    ...(passwordHash ? { passwordHash } : {})
  };
  if (data.id) await prisma.user.update({ where: { id: data.id }, data: payload });
  else await prisma.user.create({ data: payload });
  refresh("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(formData: FormData) {
  const actor = await requireAdmin();
  if (actor.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can delete users.");
  const id = z.string().parse(formData.get("id"));
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.role === "SUPER_ADMIN") {
    const superAdmins = await prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true } });
    if (superAdmins <= 1) throw new Error("The last Super Admin cannot be deleted.");
  }
  await prisma.user.delete({ where: { id } });
  refresh("/admin/users");
}

export async function saveRole(formData: FormData) {
  const actor = await requireAdmin();
  if (actor.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can manage roles.");
  const data = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    description: z.string().optional()
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    name: text(formData.get("name")),
    description: text(formData.get("description"))
  });
  const role = data.id
    ? await prisma.appRole.update({ where: { id: data.id }, data: { name: data.name, description: data.description || null } })
    : await prisma.appRole.create({ data: { name: data.name, description: data.description || null } });
  if (role.isSystem && role.name === "Super Admin") {
    refresh("/admin/roles", "/admin/users");
    redirect("/admin/roles");
  }
  await prisma.appRolePermission.deleteMany({ where: { roleId: role.id } });
  const permissions = formData.getAll("permission").map(String).map((value) => {
    const [module, action] = value.split(":");
    return { roleId: role.id, module, action };
  }).filter((item) => item.module && item.action);
  if (permissions.length) await prisma.appRolePermission.createMany({ data: permissions });
  refresh("/admin/roles", "/admin/users");
  redirect("/admin/roles");
}

export async function deleteRole(formData: FormData) {
  const actor = await requireAdmin();
  if (actor.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can manage roles.");
  const id = z.string().parse(formData.get("id"));
  const role = await prisma.appRole.findUnique({ where: { id }, include: { users: true } });
  if (role?.isSystem || role?.users.length) throw new Error("System roles or roles assigned to users cannot be deleted.");
  await prisma.appRole.delete({ where: { id } });
  refresh("/admin/roles");
}

export async function saveCmsPage(formData: FormData) {
  await requirePagePermission("Edit");
  const data = z.object({
    id: z.string().min(1),
    pageKey: z.nativeEnum(PageKey),
    title: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    status: z.nativeEnum(PublishStatus)
  }).parse({
    id: text(formData.get("id")),
    pageKey: text(formData.get("pageKey")),
    title: text(formData.get("title")),
    slug: text(formData.get("slug")),
    metaTitle: text(formData.get("metaTitle")),
    metaDescription: text(formData.get("metaDescription")),
    status: status(formData.get("status"))
  });
  await prisma.page.update({
    where: { id: data.id },
    data: {
      title: data.title,
      slug: data.slug,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      status: data.status
    }
  });
  refresh(`/${data.slug}`, `/admin/pages/${data.pageKey}`, "/admin/pages");
  redirect(`/admin/pages/${data.pageKey}?saved=page`);
}

export async function savePageSection(formData: FormData) {
  await requirePagePermission(text(formData.get("id")) ? "Edit" : "Create");
  const parsedSettings = parseJson(formData.get("settingsJson"));
  const settingsKicker = text(formData.get("settingsKicker"));
  const settingsJson = settingsKicker
    ? { ...((parsedSettings && typeof parsedSettings === "object" && !Array.isArray(parsedSettings)) ? parsedSettings : {}), kicker: settingsKicker }
    : parsedSettings;
  const data = z.object({
    id: z.string().optional(),
    pageId: z.string().min(1),
    pageKey: z.nativeEnum(PageKey),
    sectionKey: z.string().min(2).regex(/^[a-z0-9-]+$/),
    sectionType: z.string().min(2),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    body: z.string().optional(),
    sortOrder: z.coerce.number().int(),
    isPublished: z.boolean()
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    pageId: text(formData.get("pageId")),
    pageKey: text(formData.get("pageKey")),
    sectionKey: text(formData.get("sectionKey")),
    sectionType: text(formData.get("sectionType")),
    title: text(formData.get("title")),
    subtitle: text(formData.get("subtitle")),
    body: text(formData.get("body")),
    sortOrder: text(formData.get("sortOrder")) || "0",
    isPublished: formData.get("isPublished") === "on"
  });
  const payload = {
    sectionKey: data.sectionKey,
    sectionType: data.sectionType,
    title: data.title,
    subtitle: data.subtitle || null,
    body: data.body || null,
    sortOrder: data.sortOrder,
    isPublished: data.isPublished,
    settingsJson
  };
  if (data.id) await prisma.pageSection.update({ where: { id: data.id }, data: payload });
  else await prisma.pageSection.create({ data: { pageId: data.pageId, ...payload } });
  refresh(`/${data.pageKey}`, `/admin/pages/${data.pageKey}`);
  redirect(`/admin/pages/${data.pageKey}?saved=section`);
}

export async function deletePageSection(formData: FormData) {
  await requirePagePermission("Delete");
  const data = z.object({ id: z.string().min(1), pageKey: z.nativeEnum(PageKey) }).parse({
    id: text(formData.get("id")),
    pageKey: text(formData.get("pageKey"))
  });
  const items = await prisma.pageSectionItem.findMany({ where: { sectionId: data.id } });
  await prisma.pageSection.delete({ where: { id: data.id } });
  await Promise.all(items.flatMap((item) => [deletePublicUpload(item.imagePath), deletePublicUpload(item.videoPath)]));
  refresh(`/${data.pageKey}`, `/admin/pages/${data.pageKey}`);
}

export async function savePageSectionItem(formData: FormData) {
  await requirePagePermission(text(formData.get("id")) ? "Edit" : "Create");
  const settingsJson = parseJson(formData.get("settingsJson"));
  const data = z.object({
    id: z.string().optional(),
    sectionId: z.string().min(1),
    pageKey: z.nativeEnum(PageKey),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    body: z.string().optional(),
    icon: z.string().optional(),
    imagePath: z.string().optional(),
    videoPath: z.string().optional(),
    linkText: z.string().optional(),
    linkUrl: z.string().optional(),
    badge: z.string().optional(),
    sortOrder: z.coerce.number().int(),
    isPublished: z.boolean()
  }).parse({
    id: optional(formData.get("id")) ?? undefined,
    sectionId: text(formData.get("sectionId")),
    pageKey: text(formData.get("pageKey")),
    title: text(formData.get("title")),
    subtitle: text(formData.get("subtitle")),
    body: text(formData.get("body")),
    icon: text(formData.get("icon")),
    imagePath: text(formData.get("imagePath")),
    videoPath: text(formData.get("videoPath")),
    linkText: text(formData.get("linkText")),
    linkUrl: text(formData.get("linkUrl")),
    badge: text(formData.get("badge")),
    sortOrder: text(formData.get("sortOrder")) || "0",
    isPublished: formData.get("isPublished") === "on"
  });
  const existing = data.id ? await prisma.pageSectionItem.findUnique({ where: { id: data.id } }) : null;
  const imageFile = getFiles(formData, "imageFile")[0];
  const videoFile = getFiles(formData, "videoFile")[0];
  let imagePath = data.imagePath || existing?.imagePath || null;
  let videoPath = data.videoPath || existing?.videoPath || null;
  try {
    if (imageFile) {
      const saved = await saveUpload(imageFile, { kind: "pages", fallbackName: "page-image", ...uploadRules.adminImage });
      await deletePublicUpload(existing?.imagePath);
      imagePath = saved.url;
    }
    if (videoFile) {
      const saved = await saveUpload(videoFile, { kind: "pages", fallbackName: "page-video", ...uploadRules.heroVideo });
      await deletePublicUpload(existing?.videoPath);
      videoPath = saved.url;
    }
  } catch (error) {
    redirect(`/admin/pages/${data.pageKey}?error=${encodeURIComponent(error instanceof Error ? error.message : "Page media upload failed.")}${data.id ? `&editItem=${data.id}` : ""}`);
  }
  if (formData.get("deleteImage") === "on") {
    await deletePublicUpload(existing?.imagePath);
    imagePath = null;
  }
  if (formData.get("deleteVideo") === "on") {
    await deletePublicUpload(existing?.videoPath);
    videoPath = null;
  }
  const payload = {
    title: data.title,
    subtitle: data.subtitle || null,
    body: data.body || null,
    icon: data.icon || null,
    imagePath,
    videoPath,
    linkText: data.linkText || null,
    linkUrl: data.linkUrl || null,
    badge: data.badge || null,
    sortOrder: data.sortOrder,
    settingsJson,
    isPublished: data.isPublished
  };
  if (data.id) await prisma.pageSectionItem.update({ where: { id: data.id }, data: payload });
  else await prisma.pageSectionItem.create({ data: { sectionId: data.sectionId, ...payload } });
  refresh(`/${data.pageKey}`, `/admin/pages/${data.pageKey}`);
  redirect(`/admin/pages/${data.pageKey}?saved=item`);
}

export async function deletePageSectionItem(formData: FormData) {
  await requirePagePermission("Delete");
  const data = z.object({ id: z.string().min(1), pageKey: z.nativeEnum(PageKey) }).parse({
    id: text(formData.get("id")),
    pageKey: text(formData.get("pageKey"))
  });
  const item = await prisma.pageSectionItem.findUnique({ where: { id: data.id } });
  await prisma.pageSectionItem.delete({ where: { id: data.id } });
  await deletePublicUpload(item?.imagePath);
  await deletePublicUpload(item?.videoPath);
  refresh(`/${data.pageKey}`, `/admin/pages/${data.pageKey}`);
}
