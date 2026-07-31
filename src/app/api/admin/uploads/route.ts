import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth";
import { getFiles, saveUpload, uploadRules } from "@/lib/uploads";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = getFiles(formData, "file")[0];
  if (!file) {
    return NextResponse.json({ message: "Please upload a valid image file." }, { status: 400 });
  }

  try {
    const saved = await saveUpload(file, { kind: "resources", fallbackName: "article-image", ...uploadRules.adminImage });
    return NextResponse.json({ ok: true, url: saved.url, message: "Image uploaded successfully." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Image upload failed. Please try again." },
      { status: 400 }
    );
  }
}

