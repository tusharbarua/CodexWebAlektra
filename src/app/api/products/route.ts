import { NextResponse } from "next/server";
import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const sort = searchParams.get("sort") ?? "featured";

  const products = await prisma.product.findMany({
    where: {
      status: PublishStatus.PUBLISHED,
      isFeatured: featured === "true" ? true : undefined,
      category: category ? { slug: category } : undefined,
      OR: q
        ? [
            { name: { contains: q } },
            { sku: { contains: q } },
            { model: { contains: q } }
          ]
        : undefined
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      model: true,
      brand: true,
      priceBdt: true,
      compareAtPriceBdt: true,
      stockQuantity: true,
      isFeatured: true,
      category: { select: { id: true, name: true, slug: true } },
      images: {
        select: { id: true, imagePath: true, altText: true, sortOrder: true, isPrimary: true },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1
      }
    },
    orderBy:
      sort === "price-asc"
        ? { priceBdt: "asc" }
        : sort === "price-desc"
          ? { priceBdt: "desc" }
          : [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({
    products: products.map((product) => ({
      ...product,
      oldPrice: product.compareAtPriceBdt ? Number(product.compareAtPriceBdt) : null
    }))
  });
}
