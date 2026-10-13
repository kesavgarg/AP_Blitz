"use server";

import { revalidatePath } from "next/cache";
import { AnnouncementAudience } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireUser } from "@/lib/auth";
import { fanoutAnnouncement } from "@/lib/announcements";

const AUDIENCES: AnnouncementAudience[] = ["EVERYONE", "BLITZERS", "TEAM", "SUBJECT"];

function refresh() {
  revalidatePath("/workspace/announcements");
  revalidatePath("/student/announcements");
  revalidatePath("/student/dashboard");
  revalidatePath("/workspace");
  revalidatePath("/admin");
}

export async function publishAnnouncement(formData: FormData) {
  const user = await requireUser();
  if (!isAdmin(user)) return;
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const audienceRaw = String(formData.get("audience") || "TEAM");
  const subjectSlug = String(formData.get("subjectSlug") || "");
  const scheduledRaw = String(formData.get("scheduledFor") || "");
  if (!title || !body) return;
  if (!AUDIENCES.includes(audienceRaw as AnnouncementAudience)) return;
  const audience = audienceRaw as AnnouncementAudience;
  if (audience === "SUBJECT" && !subjectSlug) return;
  const scheduledFor = scheduledRaw ? new Date(scheduledRaw) : null;
  if (scheduledRaw && (!scheduledFor || Number.isNaN(scheduledFor.getTime()))) return;

  const row = await prisma.announcement.create({
    data: {
      title: title.slice(0, 160),
      body: body.slice(0, 8000),
      authorId: user.id,
      pinned: formData.get("pinned") === "on",
      audience,
      subjectSlug: audience === "SUBJECT" ? subjectSlug : null,
      scheduledFor,
    },
  });
  await fanoutAnnouncement(row.id);
  refresh();
}

export async function archiveAnnouncement(formData: FormData) {
  const user = await requireUser();
  if (!isAdmin(user)) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.announcement.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  refresh();
}

export async function updateAnnouncement(formData: FormData) {
  const user = await requireUser();
  if (!isAdmin(user)) return;
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!id || !title || !body) return;
  await prisma.announcement.update({
    where: { id },
    data: { title: title.slice(0, 160), body: body.slice(0, 8000) },
  });
  refresh();
}
