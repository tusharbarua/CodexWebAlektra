import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!isAdminRole(session?.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.thermalInspectionRequest.findMany({ orderBy: { createdAt: "desc" } });
  const header = [
    "Request ID",
    "Created",
    "Inspection",
    "Institution",
    "Email",
    "Phone",
    "PV kWp",
    "AC kW",
    "Location",
    "Place Name",
    "Formatted Address",
    "Google Place ID",
    "Latitude",
    "Longitude",
    "Distance From Base Km",
    "Distance Status",
    "Status",
    "Payment",
    "Fee"
  ];
  const csv = [header, ...rows.map((row) => [
    row.requestNumber,
    row.createdAt.toISOString(),
    row.inspectionType,
    row.institutionName,
    row.email,
    row.contactNumber,
    row.pvCapacityKwp,
    row.acCapacityKw,
    row.projectLocation,
    row.projectLocationName ?? "",
    row.projectFormattedAddress ?? "",
    row.googlePlaceId ?? "",
    row.latitude ?? "",
    row.longitude ?? "",
    row.distanceFromBaseKm ?? "",
    row.distanceCalculationStatus,
    row.status,
    row.paymentStatus,
    row.calculatedFeeBdt ?? ""
  ])]
    .map((values) => values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="alektra-thermal-requests.csv"' } });
}
