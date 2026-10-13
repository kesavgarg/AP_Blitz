import "server-only";
import { AnnouncementAudience, PermissionRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/activity";

const TEAM_ROLES: PermissionRole[] = ["FOUNDER", "TEAM_ADMIN", "MEMBER"];

export async function fanoutAnnouncement(id: string) {
  const row = await prisma.announcement.findUnique({ where: { id } });
  if (!row || row.archivedAt || row.notifiedAt) return;
  if (row.scheduledFor && row.scheduledFor > new Date()) return;

  const recipients = await announcementRecipients(row.audience, row.subjectSlug);
  for (const person of recipients) {
    if (person.id === row.authorId) continue;
    await notify({
      userId: person.id,
      title: row.title,
      body: row.body.slice(0, 180),
      href: person.role === "BLITZER" ? "/student/announcements" : "/workspace/announcements",
      kind: "announcements",
      dedupeKey: `announcement:${row.id}`,
    });
  }
  await prisma.announcement.update({
    where: { id: row.id },
    data: { notifiedAt: new Date() },
  });
}

async function announcementRecipients(audience: AnnouncementAudience, subjectSlug: string | null) {
  if (audience === "TEAM") {
    return prisma.user.findMany({
      where: { isActive: true, role: { in: TEAM_ROLES } },
      select: { id: true, role: true },
    });
  }
  if (audience === "BLITZERS") {
    return prisma.user.findMany({
      where: { isActive: true, role: "BLITZER" },
      select: { id: true, role: true },
    });
  }
  if (audience === "SUBJECT" && subjectSlug) {
    const enrolled = await prisma.studentClass.findMany({
      where: { subject: { slug: subjectSlug }, user: { isActive: true, role: "BLITZER" } },
      select: { user: { select: { id: true, role: true } } },
    });
    const staff = await prisma.user.findMany({
      where: { isActive: true, role: { in: TEAM_ROLES } },
      select: { id: true, role: true },
    });
    const map = new Map<string, { id: string; role: PermissionRole }>();
    for (const row of enrolled) map.set(row.user.id, row.user);
    for (const person of staff) map.set(person.id, person);
    return [...map.values()];
  }
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, role: true },
  });
}

export async function flushScheduledAnnouncements() {
  const due = await prisma.announcement.findMany({
    where: {
      notifiedAt: null,
      archivedAt: null,
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
    },
    select: { id: true },
  });
  for (const row of due) {
    await fanoutAnnouncement(row.id);
  }
}
