import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!isAdminRole(session?.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    include: { category: true, images: true },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdminRole(session?.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const product = await prisma.product.create({ data });
  return NextResponse.json({ product });
}
