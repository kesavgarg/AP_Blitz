import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

export async function notify(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}) {
  await prisma.notification.create({ data: input });
}

export async function notifyMany(
  userIds: string[],
  payload: { title: string; body: string; href?: string },
) {
  if (!userIds.length) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...payload })),
  });
}

export async function nextApplicationId() {
  const year = new Date().getFullYear();
  const count = await prisma.application.count({
    where: { applicationId: { startsWith: `APB-${year}-` } },
  });
  return `APB-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextContentId() {
  const count = await prisma.contentItem.count();
  return `C-${String(count + 1).padStart(4, "0")}`;
}
