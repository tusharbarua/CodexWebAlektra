import { PageKey } from "@prisma/client";
import { publishHeroUpload } from "@/lib/publish-hero-upload";

export const runtime = "nodejs";

export function POST(request: Request) {
  return publishHeroUpload(request, PageKey.epc);
}
