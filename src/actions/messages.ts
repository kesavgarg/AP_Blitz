"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChannelKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { canAccessChannel, canModerateChannel } from "@/lib/rbac";
import { notify, notifyMany, logActivity } from "@/lib/activity";
import { saveUpload } from "@/lib/files";

export async function sendMessage(formData: FormData) {
  const user = await requireUser();
  const channelId = String(formData.get("channelId") || "");
  const body = String(formData.get("body") || "").trim();
  const file = formData.get("file");
  const channel = await prisma.messageChannel.findUnique({ where: { id: channelId } });
  if (!channel || !canAccessChannel(user, channel.key)) {
    return;
  }
  if (!body && !(file instanceof File && file.size > 0)) {
    return;
  }

  let fileId: string | undefined;
  if (file instanceof File && file.size > 0) {
    const saved = await saveUpload(file, user.id);
    fileId = saved.id;
  }

  const message = await prisma.message.create({
    data: {
      channelId,
      authorId: user.id,
      body: body || (file instanceof File ? file.name : ""),
      fileId,
    },
  });

  const memberWhere =
    channel.key === "GENERAL"
      ? { isActive: true, id: { not: user.id } }
      : channel.key === "ADMIN"
        ? {
            isActive: true,
            id: { not: user.id },
            role: { in: ["FOUNDER" as const, "TEAM_ADMIN" as const] },
          }
        : {
            isActive: true,
            id: { not: user.id },
            OR: [
              { role: "FOUNDER" as const },
              { memberships: { some: { team: { channel: { key: channel.key } } } } },
            ],
          };

  const members = await prisma.user.findMany({
    where: memberWhere,
    select: { id: true },
  });

  await Promise.all(
    members.slice(0, 50).map((m) =>
      notify({
        userId: m.id,
        title: `New message in ${channel.name}`,
        body: `${user.firstName}: ${message.body.slice(0, 80)}`,
        href: `/workspace/messages/${channel.id}`,
      }),
    ),
  );

  revalidatePath(`/workspace/messages/${channel.id}`);
  revalidatePath("/workspace/messages");
  revalidatePath("/workspace");
}

export async function broadcastToTeam(formData: FormData) {
  const user = await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title || !body) return;

  await prisma.announcement.create({
    data: { title, body, authorId: user.id, pinned: true },
  });

  const general = await prisma.messageChannel.findUnique({ where: { key: "GENERAL" } });
  if (general) {
    await prisma.message.create({
      data: {
        channelId: general.id,
        authorId: user.id,
        body: `${title}\n\n${body}`,
      },
    });
  }

  const members = await prisma.user.findMany({
    where: { isActive: true, id: { not: user.id } },
    select: { id: true },
  });
  await notifyMany(
    members.map((m) => m.id),
    {
      title,
      body: body.slice(0, 160),
      href: general ? `/workspace/messages/${general.id}` : "/workspace",
    },
  );
  await logActivity({
    userId: user.id,
    action: `${user.firstName} broadcast "${title}" to the team`,
    objectType: "Announcement",
  });

  revalidatePath("/workspace");
  revalidatePath("/workspace/messages");
  revalidatePath("/admin/messages");
  redirect("/admin/messages?sent=1");
}

export async function pinMessage(formData: FormData) {
  const user = await requireUser();
  const messageId = String(formData.get("messageId") || "");
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });
  if (!message || !canModerateChannel(user, message.channel.key)) {
    return;
  }
  const existing = await prisma.messagePin.findUnique({
    where: { messageId_userId: { messageId, userId: user.id } },
  });
  if (existing) {
    await prisma.messagePin.delete({ where: { id: existing.id } });
  } else {
    await prisma.messagePin.create({ data: { messageId, userId: user.id } });
  }
  revalidatePath(`/workspace/messages/${message.channelId}`);
}

export async function deleteMessage(formData: FormData) {
  const user = await requireUser();
  const messageId = String(formData.get("messageId") || "");
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });
  if (!message) return;
  if (message.authorId !== user.id && !canModerateChannel(user, message.channel.key)) {
    return;
  }
  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), body: "This message was removed." },
  });
  await logActivity({
    userId: user.id,
    action: `${user.firstName} removed a message in ${message.channel.name}`,
    objectType: "Message",
    objectId: messageId,
  });
  revalidatePath(`/workspace/messages/${message.channelId}`);
}

export async function markChannelRead(channelId: string, userId: string) {
  const messages = await prisma.message.findMany({
    where: { channelId, deletedAt: null },
    select: { id: true },
    take: 100,
    orderBy: { createdAt: "desc" },
  });
  await prisma.messageRead.createMany({
    data: messages.map((m) => ({ messageId: m.id, userId })),
    skipDuplicates: true,
  });
}

export async function channelKeyOf(id: string): Promise<ChannelKey | null> {
  const ch = await prisma.messageChannel.findUnique({ where: { id } });
  return ch?.key ?? null;
}
