import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function guard() {
  const session = await auth();
  return isAdminRole(session?.user.role);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json();
  const { id } = await params;
  const product = await prisma.product.update({ where: { id }, data });
  return NextResponse.json({ product });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
