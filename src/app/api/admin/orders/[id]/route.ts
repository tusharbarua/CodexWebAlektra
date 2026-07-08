import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const orderUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  notes: z.string().trim().max(5000).optional()
}).strict();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminRole(session?.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = orderUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order update payload." }, { status: 400 });
  }
  const { id } = await params;
  const order = await prisma.order.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ order });
}
