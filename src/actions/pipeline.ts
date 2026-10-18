"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireTeam } from "@/lib/auth";
import { logActivity, nextContentId } from "@/lib/activity";
import { isWorkStage } from "@/lib/stages";
import { isPromotionalMember } from "@/lib/one-time";

function refresh() {
  revalidatePath("/workspace/pipeline");
  revalidatePath("/workspace/completed");
  revalidatePath("/admin/content");
  revalidatePath("/workspace");
}

export async function createPipelineItem(formData: FormData) {
  const user = await requireTeam();
  if (user.role === "BLITZER") return;
  if (await isPromotionalMember(user.id, user.role)) return;
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const deadlineRaw = String(formData.get("deadline") || "");
  const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
  if (deadlineRaw && deadline && Number.isNaN(deadline.getTime())) return;
  const ownerId = String(formData.get("ownerId") || "") || user.id;
  const contentId = await nextContentId();
  const item = await prisma.contentItem.create({
    data: {
      contentId,
      title: title.slice(0, 180),
      apSubject: String(formData.get("apSubject") || "") || null,
      apUnit: String(formData.get("apUnit") || "") || null,
      notes: String(formData.get("notes") || "") || null,
      status: "IDEA",
      stage: "TODO",
      ownerId,
      deadline,
    },
  });
  await prisma.contentHistory.create({
    data: { contentId: item.id, userId: user.id, action: "Added to To Do", toStatus: "TODO" },
  });
  await logActivity({
    userId: user.id,
    action: `${user.firstName} added ${contentId} to the pipeline`,
    objectType: "ContentItem",
    objectId: contentId,
  });
  refresh();
}

export async function moveContentStage(formData: FormData) {
  const user = await requireTeam();
  if (user.role === "BLITZER") return;
  const id = String(formData.get("id") || "");
  const stage = String(formData.get("stage") || "");
  if (!isWorkStage(stage)) return;
  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item) return;
  const staff = isAdmin(user) || item.ownerId === user.id;
  if (!staff) return;
  if (item.stage === "COMPLETED" && stage !== "COMPLETED" && !isAdmin(user)) return;

  const completing = stage === "COMPLETED";
  const status =
    stage === "COMPLETED"
      ? "READY_TO_PUBLISH"
      : stage === "NEEDS_REVIEW"
        ? "FINAL_REVIEW"
        : stage === "IN_PROGRESS"
          ? "VIDEO_IN_PROGRESS"
          : "IDEA";

  await prisma.contentItem.update({
    where: { id },
    data: {
      stage,
      status,
      completedAt: completing ? new Date() : null,
      completedById: completing ? user.id : null,
    },
  });
  await prisma.contentHistory.create({
    data: {
      contentId: id,
      userId: user.id,
      action: completing ? `${user.firstName} completed this` : `${user.firstName} moved it to ${stage}`,
      fromStatus: item.stage,
      toStatus: stage,
    },
  });
  await logActivity({
    userId: user.id,
    action: `${user.firstName} moved ${item.contentId} to ${stage}`,
    objectType: "ContentItem",
    objectId: item.contentId,
  });
  refresh();
}
