"use server";

import { revalidatePath } from "next/cache";
import { TaskStatus, TeamKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isFounder, onTeam, requireTeam } from "@/lib/auth";
import { logActivity, notify } from "@/lib/activity";
import { sendAssignment } from "@/lib/email";

export async function createTask(formData: FormData) {
  const user = await requireTeam();
  if (user.role === "MEMBER") return;
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const assigneeId = String(formData.get("assigneeId") || "") || null;
  const teamKey = (String(formData.get("teamKey") || "") || null) as TeamKey | null;
  const deadlineRaw = String(formData.get("deadline") || "");
  const description = String(formData.get("description") || "") || null;
  const contentItemId = String(formData.get("contentItemId") || "") || null;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      assigneeId,
      creatorId: user.id,
      teamKey,
      contentItemId,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });

  if (assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (assignee) {
      await notify({
        userId: assigneeId,
        title: "New task assigned",
        body: title,
        href: "/workspace/tasks",
      });
      await sendAssignment(assignee.email, assignee.firstName, title, "/workspace/tasks");
    }
  }
  await logActivity({
    userId: user.id,
    action: `${user.firstName} created task "${title}"`,
    objectType: "Task",
    objectId: task.id,
  });
  revalidatePath("/workspace/tasks");
  revalidatePath("/admin");
}

export async function updateTaskStatus(formData: FormData) {
  const user = await requireTeam();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as TaskStatus;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  const allowed =
    isFounder(user) ||
    task.assigneeId === user.id ||
    task.creatorId === user.id ||
    (task.teamKey && onTeam(user, task.teamKey) && user.role !== "MEMBER");
  if (!allowed) return;
  await prisma.task.update({ where: { id }, data: { status } });
  if (task.assigneeId && (status === "NEEDS_REVISION" || status === "COMPLETED")) {
    await notify({
      userId: task.assigneeId,
      title: status === "COMPLETED" ? "Task approved" : "Task needs revision",
      body: task.title,
      href: "/workspace/tasks",
    });
  }
  revalidatePath("/workspace/tasks");
}
