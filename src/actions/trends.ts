"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireTeam } from "@/lib/auth";

function refresh() {
  revalidatePath("/workspace/trends");
}

export async function addTrendLink(formData: FormData) {
  const user = await requireTeam();
  const url = String(formData.get("url") || "").trim();
  const note = String(formData.get("note") || "").trim().slice(0, 240);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return;
  await prisma.trendLink.create({
    data: { url, note, createdById: user.id },
  });
  refresh();
}

export async function claimTrendLink(formData: FormData) {
  const user = await requireTeam();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.trendLink.updateMany({
    where: { id, claimedById: null },
    data: { claimedById: user.id },
  });
  refresh();
}

export async function deleteTrendLink(formData: FormData) {
  const user = await requireTeam();
  if (!isAdmin(user)) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.trendLink.delete({ where: { id } }).catch(() => undefined);
  refresh();
}
