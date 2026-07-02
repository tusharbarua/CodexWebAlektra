import { NextResponse } from "next/server";
import { searchBangladeshLocation } from "@/lib/bangladesh-location-service";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    return NextResponse.json({ ok: true, items: searchBangladeshLocation(q) });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Location search could not be completed. Please enter your address manually.",
      detail: error instanceof Error ? error.message : "Local location dataset failed."
    }, { status: 500 });
  }
}
