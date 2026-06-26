import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await auth();
  const user = session?.user;
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const latest = await prisma.impactSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  const data = {
    plantsInOperation: body.plantsInOperation,
    totalInstalledCapacityKw: body.totalInstalledCapacityKw,
    kwhGenerated: body.kwhGenerated,
    equivalentTreesPlanted: body.equivalentTreesPlanted,
    co2OffsetTons: body.co2OffsetTons,
    longHaulFlightsAvoided: body.longHaulFlightsAvoided,
    manualBaselineJson: {
      source: "Admin manual baseline update",
      updatedBy: user.email,
      updatedAt: new Date().toISOString(),
      baseline: {
        kwhGenerated: body.kwhGenerated,
        co2OffsetTons: body.co2OffsetTons,
        equivalentTreesPlanted: body.equivalentTreesPlanted,
        longHaulFlightsAvoided: body.longHaulFlightsAvoided
      }
    }
  };

  const snapshot = latest
    ? await prisma.impactSnapshot.update({ where: { id: latest.id }, data })
    : await prisma.impactSnapshot.create({ data });

  return NextResponse.json({ snapshot });
}
