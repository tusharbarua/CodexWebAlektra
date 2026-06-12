import { NextResponse } from "next/server";
import { getImpactSnapshot } from "@/lib/impact";

export async function GET() {
  const snapshot = await getImpactSnapshot();
  return NextResponse.json({ snapshot });
}
