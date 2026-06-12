import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!isAdminRole(session?.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const articles = await prisma.resourceArticle.findMany({
    include: { category: true, author: true },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdminRole(session?.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const article = await prisma.resourceArticle.create({ data: { ...data, authorId: session?.user.id } });
  return NextResponse.json({ article });
}
