import { prisma } from "@/lib/prisma";

const ALLOWED = ["/workspace/trends", "/workspace/kesav", "/workspace/commitment"];

/** Latest accepted application is the one-video lane, and they are still a regular member. */
export async function isOneTimeMember(userId: string, role?: string) {
  if (role === "FOUNDER" || role === "TEAM_ADMIN" || role === "BLITZER") return false;
  const latest = await prisma.application.findFirst({
    where: { acceptedUserId: userId, status: "ACCEPTED" },
    orderBy: { reviewedAt: "desc" },
    select: { commitment: true, reviewedAt: true },
  });
  if (!latest || latest.commitment !== "ONE_TIME") return null;
  return { acceptedAt: latest.reviewedAt ?? new Date() };
}

export function oneTimePathAllowed(pathname: string) {
  return ALLOWED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
