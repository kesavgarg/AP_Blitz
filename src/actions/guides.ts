"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFounder } from "@/lib/auth";
import { saveUpload } from "@/lib/files";

export async function uploadGuideVideo(formData: FormData) {
  const user = await requireFounder();
  const which = String(formData.get("which") || "");
  if (which !== "record" && which !== "promo") return;
  const file = formData.get("video");
  if (!(file instanceof File) || file.size < 1) return;
  const saved = await saveUpload(file, user.id);
  await prisma.orgSettings.update({
    where: { id: "org" },
    data: which === "record" ? { howToRecordFileId: saved.id } : { promoGuideFileId: saved.id },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/workspace/how-to-record");
  revalidatePath("/workspace/promo-guide");
}
