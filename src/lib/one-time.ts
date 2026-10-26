import { cache } from "react";
import { prisma } from "@/lib/prisma";

export { oneTimePathAllowed } from "@/lib/one-time-paths";

/** Latest accepted application for a regular member. Founders, admins, and Blitzers are not gated. */
export const getMemberLane = cache(async function getMemberLane(userId: string, role?: string) {
  if (role === "FOUNDER" || role === "TEAM_ADMIN" || role === "BLITZER") return null;
  return prisma.application.findFirst({
    where: { acceptedUserId: userId, status: "ACCEPTED" },
    orderBy: { reviewedAt: "desc" },
    select: {
      id: true,
      commitment: true,
      videoLane: true,
      reviewedAt: true,
      joinRequestedAt: true,
    },
  });
});

/** Latest accepted application is the one-video lane, and they are still a regular member. */
export async function isOneTimeMember(userId: string, role?: string) {
  const latest = await getMemberLane(userId, role);
  if (!latest || latest.commitment !== "ONE_TIME") return null;
  return {
    acceptedAt: latest.reviewedAt ?? new Date(),
    joinRequestedAt: latest.joinRequestedAt,
    applicationId: latest.id,
  };
}

export async function isPromotionalMember(userId: string, role?: string) {
  const latest = await getMemberLane(userId, role);
  return Boolean(latest && latest.commitment !== "ONE_TIME" && latest.videoLane === "PROMOTIONAL");
}

export async function isEducationalVideoTaker(
  userId: string,
  role?: string,
  teams?: { key: string }[],
) {
  if (role === "FOUNDER" || role === "BLITZER") return false;
  const latest = await getMemberLane(userId, role);
  if (latest?.commitment === "ONE_TIME" || latest?.videoLane === "PROMOTIONAL") return false;
  if (latest?.videoLane === "EDUCATIONAL") return true;
  return Boolean(teams?.some((team) => team.key === "VIDEO_CREATOR"));
}
