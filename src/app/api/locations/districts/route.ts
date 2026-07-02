import { NextResponse } from "next/server";
import { getDistrictsByDivision } from "@/lib/bangladesh-location-service";

export async function GET(request: Request) {
  const divisionId = new URL(request.url).searchParams.get("divisionId") ?? "";
  if (!divisionId) return NextResponse.json({ ok: false, error: "Division is required." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, items: await getDistrictsByDivision(divisionId) });
  } catch (error) {
    return NextResponse.json(locationError(error), { status: 500 });
  }
}

function locationError(error: unknown) {
  return {
    ok: false,
    error: "Location data could not be loaded. Please enter your address manually.",
    detail: error instanceof Error ? error.message : "Local location dataset failed."
  };
}
