import { isDivisionHeroPageKey } from "@/lib/hero-upload-config";
import { publishHeroUpload } from "@/lib/publish-hero-upload";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await params;
  if (!isDivisionHeroPageKey(pageKey)) {
    return Response.json({ error: "Unknown hero page." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return publishHeroUpload(request, pageKey);
}
