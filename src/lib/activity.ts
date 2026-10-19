import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { deliverPush } from "@/lib/push";

export type NoticeKind =
  | "newVideos"
  | "subjectVideos"
  | "announcements"
  | "requestUpdates"
  | "teamMessages"
  | "deadlines"
  | "meetings";

export async function logActivity(input: {
  userId?: string | null;
  action: string;
  objectType?: string;
  objectId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      userId: input.userId ?? undefined,
      action: input.action,
      objectType: input.objectType,
      objectId: input.objectId,
      metadata: input.metadata,
    },
  });
}

async function allowsNotice(userId: string, kind?: NoticeKind) {
  if (!kind) return true;
  const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!pref) return true;
  return pref[kind] !== false;
}

export async function notify(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
  kind?: NoticeKind;
  dedupeKey?: string;
}) {
  if (!(await allowsNotice(input.userId, input.kind))) return null;
  try {
    const row = await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        href: input.href,
        dedupeKey: input.dedupeKey,
      },
    });
    await deliverPush(input.userId, { title: input.title, body: input.body, href: input.href });
    return row;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return null;
    throw err;
  }
}

export async function notifyMany(
  userIds: string[],
  payload: { title: string; body: string; href?: string },
  opts?: { kind?: NoticeKind; dedupeKey?: string },
) {
  const unique = [...new Set(userIds)];
  if (!unique.length) return;
  let ids = unique;
  if (opts?.kind) {
    const blocked = await prisma.notificationPreference.findMany({
      where: { userId: { in: ids }, [opts.kind]: false },
      select: { userId: true },
    });
    const skip = new Set(blocked.map((row) => row.userId));
    ids = ids.filter((id) => !skip.has(id));
  }
  if (!ids.length) return;
  let fresh = ids;
  if (opts?.dedupeKey) {
    const existing = await prisma.notification.findMany({
      where: { userId: { in: ids }, dedupeKey: opts.dedupeKey },
      select: { userId: true },
    });
    const have = new Set(existing.map((row) => row.userId));
    fresh = ids.filter((id) => !have.has(id));
  }
  if (!fresh.length) return;
  await prisma.notification.createMany({
    data: fresh.map((userId) => ({
      userId,
      title: payload.title,
      body: payload.body,
      href: payload.href,
      dedupeKey: opts?.dedupeKey,
    })),
    skipDuplicates: true,
  });
  await Promise.all(fresh.map((id) => deliverPush(id, payload)));
}

export async function nextApplicationId() {
  const year = new Date().getFullYear();
  const count = await prisma.application.count({
    where: { applicationId: { startsWith: `APB-${year}-` } },
  });
  return `APB-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextContentId() {
  const rows = await prisma.contentItem.findMany({ select: { contentId: true } });
  let max = 0;
  for (const row of rows) {
    const match = /^C-(\d+)$/.exec(row.contentId);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `C-${String(max + 1).padStart(4, "0")}`;
}
