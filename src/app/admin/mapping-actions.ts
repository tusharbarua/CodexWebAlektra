"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) throw new Error("Unauthorized");
  return session.user;
}

export async function updateMappingRequest(formData: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string().min(1),
    status: z.enum(["NEW", "REVIEWED", "QUOTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
    internalNotes: z.string().optional()
  }).parse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
    internalNotes: String(formData.get("internalNotes") ?? "").trim()
  });
  await prisma.mappingServiceRequest.update({
    where: { id: data.id },
    data: {
      status: data.status,
      internalNotes: data.internalNotes || null
    }
  });
  revalidatePath("/admin/mapping-requests");
}
