import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminRole(session?.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json();
  const { id } = await params;
  const order = await prisma.order.update({ where: { id }, data });
  return NextResponse.json({ order });
}
