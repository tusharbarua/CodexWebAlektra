import { NextResponse } from "next/server";
import { getPostcodesByDistrict } from "@/lib/bangladesh-location-service";

export async function GET(request: Request) {
  const districtId = new URL(request.url).searchParams.get("districtId") ?? "";
  if (!districtId) return NextResponse.json({ ok: false, error: "District is required." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, items: getPostcodesByDistrict(districtId) });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Location data could not be loaded. Please enter your address manually.",
      detail: error instanceof Error ? error.message : "Local location dataset failed."
    }, { status: 500 });
  }
}
