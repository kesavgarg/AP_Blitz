"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireFounder, requireTeam } from "@/lib/auth";
import { saveUpload } from "@/lib/files";

export async function dismissGuide(formData: FormData) {
  const user = await requireTeam();
  const which = String(formData.get("which") || "");
  if (which !== "educational" && which !== "promo") return;
  await prisma.user.update({
    where: { id: user.id },
    data: which === "educational" ? { educationalGuideSeenAt: new Date() } : { promoGuideSeenAt: new Date() },
  });
  revalidatePath("/workspace");
  revalidatePath(which === "educational" ? "/workspace/how-to-record" : "/workspace/promo-guide");
  redirect("/workspace");
}

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
