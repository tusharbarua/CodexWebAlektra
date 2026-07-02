import { NextResponse } from "next/server";
import { getDivisions } from "@/lib/bangladesh-location-service";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, items: await getDivisions() });
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
