import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChannel } from "@/lib/rbac";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ unread: 0 });

  const [channels, notes] = await Promise.all([
    prisma.messageChannel.findMany({ include: { members: { select: { userId: true } } } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  const accessible = channels.filter((c) => canAccessChannel(user, c)).map((c) => c.id);
  const unreadMessages = accessible.length
    ? await prisma.message.count({
        where: {
          channelId: { in: accessible },
          deletedAt: null,
          authorId: { not: user.id },
          reads: { none: { userId: user.id } },
        },
      })
    : 0;

  return NextResponse.json({ unread: unreadMessages + notes, messages: unreadMessages, notes });
}
