import { NextResponse } from "next/server";
import { getUpazilasByDistrict } from "@/lib/bangladesh-location-service";

export async function GET(request: Request) {
  const districtId = new URL(request.url).searchParams.get("districtId") ?? "";
  if (!districtId) return NextResponse.json({ ok: false, error: "District is required." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, items: await getUpazilasByDistrict(districtId) });
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
