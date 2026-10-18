"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireTeam } from "@/lib/auth";
import { isOneTimeMember } from "@/lib/one-time";

function refresh() {
  revalidatePath("/workspace/trends");
}

export async function addTrendLink(formData: FormData) {
  const user = await requireTeam();
  if (await isOneTimeMember(user.id, user.role)) return;
  const url = String(formData.get("url") || "").trim();
  const note = String(formData.get("note") || "").trim().slice(0, 240);
  const description = String(formData.get("description") || "").trim().slice(0, 2000);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return;
  await prisma.trendLink.create({
    data: { url, note, description, createdById: user.id },
  });
  refresh();
}

export async function claimTrendLink(formData: FormData) {
  const user = await requireTeam();
  const id = String(formData.get("id") || "");
  if (!id) return;
  if (await isOneTimeMember(user.id, user.role)) {
    const already = await prisma.trendLink.findFirst({ where: { claimedById: user.id }, select: { id: true } });
    if (already) return;
  }
  await prisma.trendLink.updateMany({
    where: { id, claimedById: null },
    data: { claimedById: user.id },
  });
  refresh();
}

export async function updateTrendDescription(formData: FormData) {
  const user = await requireTeam();
  if (await isOneTimeMember(user.id, user.role)) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  const description = String(formData.get("description") || "").trim().slice(0, 2000);
  await prisma.trendLink.update({ where: { id }, data: { description } }).catch(() => undefined);
  refresh();
}

export async function completeTrendLink(formData: FormData) {
  const user = await requireTeam();
  if (await isOneTimeMember(user.id, user.role)) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.trendLink.updateMany({
    where: { id, claimedById: user.id, completedAt: null },
    data: { completedAt: new Date() },
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
