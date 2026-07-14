import { renewableLogoResponse } from "@/lib/renewable-logo-response";

export async function GET() {
  return renewableLogoResponse();
}
