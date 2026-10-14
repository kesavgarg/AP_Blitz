"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChannelKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isFounder, requireAdmin, requireTeam } from "@/lib/auth";
import { canAccessChannel, canModerateChannel } from "@/lib/rbac";
import { notify, notifyMany, logActivity } from "@/lib/activity";
import { saveUpload } from "@/lib/files";
import { slugifySubject } from "@/lib/ap-subjects";
import { isOneTimeMember } from "@/lib/one-time";

async function loadChannel(id: string) {
  return prisma.messageChannel.findUnique({
    where: { id },
    include: { members: { select: { userId: true } } },
  });
}

async function notifyChannelMembers(
  channel: { id: string; key: ChannelKey | null; kind: string; name: string },
  authorId: string,
  title: string,
  body: string,
) {
  let members: { id: string }[] = [];
  if (channel.kind === "DM") {
    members = await prisma.channelMember.findMany({
      where: { channelId: channel.id, userId: { not: authorId } },
      select: { userId: true },
    }).then((rows) => rows.map((r) => ({ id: r.userId })));
  } else if (channel.kind === "SUBJECT" || channel.key === "GENERAL") {
    members = await prisma.user.findMany({
      where: { isActive: true, id: { not: authorId } },
      select: { id: true },
    });
  } else if (channel.key === "ADMIN") {
    members = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: authorId },
        role: { in: ["FOUNDER", "TEAM_ADMIN"] },
      },
      select: { id: true },
    });
  } else {
    members = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: authorId },
        OR: [
          { role: "FOUNDER" },
          ...(channel.key
            ? [{ memberships: { some: { team: { channel: { key: channel.key } } } } }]
            : []),
        ],
      },
      select: { id: true },
    });
  }

  await Promise.all(
    members.slice(0, 80).map((m) =>
      notify({
        userId: m.id,
        title,
        body,
        href: `/workspace/messages/${channel.id}`,
      }),
    ),
  );
}

export async function sendMessage(formData: FormData) {
  const user = await requireTeam();
  const channelId = String(formData.get("channelId") || "");
  const body = String(formData.get("body") || "").trim();
  const file = formData.get("file");
  const channel = await loadChannel(channelId);
  if (!channel || !canAccessChannel(user, channel)) {
    return;
  }
  if (await isOneTimeMember(user.id, user.role)) {
    const founder = await prisma.user.findFirst({
      where: { role: "FOUNDER", isActive: true },
      select: { id: true },
    });
    const memberIds = channel.members.map((member) => member.userId);
    if (channel.kind !== "DM" || !founder || !memberIds.includes(founder.id) || !memberIds.includes(user.id)) {
      return;
    }
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

  await notifyChannelMembers(
    channel,
    user.id,
    channel.kind === "DM" ? `DM from ${user.firstName}` : `New message in ${channel.name}`,
    `${user.firstName}: ${message.body.slice(0, 80)}`,
  );

  revalidatePath(`/workspace/messages/${channel.id}`);
  revalidatePath("/workspace/messages");
  revalidatePath("/workspace");
}

export async function createSubjectChannel(formData: FormData) {
  const user = await requireAdmin();
  const apSubject = String(formData.get("apSubject") || "").trim();
  if (!apSubject) return;
  const slug = `subject:${slugifySubject(apSubject)}`;
  if (slug === "subject:") return;
  const existing = await prisma.messageChannel.findFirst({ where: { slug } });
  if (existing) {
    redirect(`/workspace/messages/${existing.id}`);
  }
  const channel = await prisma.messageChannel.create({
    data: {
      slug,
      kind: "SUBJECT",
      name: apSubject,
      apSubject,
      isPrivate: false,
    },
  });
  await logActivity({
    userId: user.id,
    action: `${user.firstName} opened ${apSubject} group chat`,
    objectType: "MessageChannel",
    objectId: channel.id,
  });
  revalidatePath("/workspace/messages");
  redirect(`/workspace/messages/${channel.id}`);
}

export async function openDirectMessage(formData: FormData) {
  const user = await requireTeam();
  const otherId = String(formData.get("userId") || "");
  if (!otherId || otherId === user.id) return;
  const other = await prisma.user.findUnique({ where: { id: otherId } });
  if (!other || !other.isActive) return;
  if (await isOneTimeMember(user.id, user.role) && other.role !== "FOUNDER") return;

  const ids = [user.id, other.id].sort();
  const slug = `dm:${ids.join(":")}`;
  let channel = await prisma.messageChannel.findFirst({ where: { slug } });
  if (!channel) {
    channel = await prisma.messageChannel.create({
      data: {
        slug,
        kind: "DM",
        name: `${other.firstName} ${other.lastName}`,
        isPrivate: true,
        members: {
          create: [{ userId: user.id }, { userId: other.id }],
        },
      },
    });
  }
  redirect(`/workspace/messages/${channel.id}`);
}

export async function broadcastToTeam(formData: FormData) {
  const user = await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title || !body) return;

  const created = await prisma.announcement.create({
    data: { title, body, authorId: user.id, pinned: true, audience: "TEAM", notifiedAt: new Date() },
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
    where: {
      isActive: true,
      id: { not: user.id },
      role: { in: ["FOUNDER", "TEAM_ADMIN", "MEMBER"] },
    },
    select: { id: true },
  });
  await notifyMany(
    members.map((m) => m.id),
    {
      title,
      body: body.slice(0, 160),
      href: general ? `/workspace/messages/${general.id}` : "/workspace",
    },
    { kind: "teamMessages", dedupeKey: `broadcast:${created.id}` },
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
  const user = await requireTeam();
  const messageId = String(formData.get("messageId") || "");
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: { include: { members: { select: { userId: true } } } } },
  });
  if (!message || !canModerateChannel(user, message.channel)) {
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
  const user = await requireTeam();
  const messageId = String(formData.get("messageId") || "");
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: { include: { members: { select: { userId: true } } } } },
  });
  if (!message) return;
  if (message.authorId !== user.id && !canModerateChannel(user, message.channel) && !isFounder(user)) {
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

export async function markChannelRead(channelId: string) {
  const user = await requireTeam();
  const channel = await prisma.messageChannel.findUnique({
    where: { id: channelId },
    include: { members: { select: { userId: true } } },
  });
  if (!channel || !canAccessChannel(user, channel)) return;
  const messages = await prisma.message.findMany({
    where: { channelId, deletedAt: null },
    select: { id: true },
    take: 100,
    orderBy: { createdAt: "desc" },
  });
  await prisma.messageRead.createMany({
    data: messages.map((m) => ({ messageId: m.id, userId: user.id })),
    skipDuplicates: true,
  });
}
