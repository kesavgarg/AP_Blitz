import { PrismaClient, PermissionRole, TeamKey, ChannelKey } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SUBJECTS } from "../src/lib/subjects";
import { stageFromStatus } from "../src/lib/stages";

const prisma = new PrismaClient();

const TEAMS: { key: TeamKey; name: string; description: string }[] = [
  {
    key: "VIDEO_CREATOR",
    name: "AP Video Creators",
    description: "On-camera AP review videos for social.",
  },
  {
    key: "SCRIPT_WRITER",
    name: "Script Writers",
    description: "Scripts, hooks, and video ideas turned into words.",
  },
  {
    key: "VIDEO_EDITOR",
    name: "Video Editors",
    description: "Short-form edits, captions, pacing, and style.",
  },
  {
    key: "SOCIAL_MEDIA",
    name: "Social Media",
    description: "Trends, skits, and the content calendar.",
  },
  {
    key: "GRAPHIC_DESIGN",
    name: "Graphic Design",
    description: "Posts, infographics, thumbnails, and brand visuals.",
  },
  {
    key: "FIVE_FOR_FIVE",
    name: "5 For 5",
    description: "Course docs, unit quizzes, tests, written questions, and 5-minute landscape videos.",
  },
];

async function main() {
  const seoTeam = await prisma.team.findUnique({ where: { key: "SEO" } });
  if (seoTeam) {
    await prisma.teamMembership.deleteMany({ where: { teamId: seoTeam.id } });
    await prisma.messageChannel.deleteMany({ where: { key: "SEO" } });
    await prisma.contentItem.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.calendarEvent.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.meeting.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.dailyLog.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.designRequest.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.team.delete({ where: { id: seoTeam.id } }).catch(() => undefined);
  }
  await prisma.messageChannel.deleteMany({ where: { key: "SEO" } });

  for (const team of TEAMS) {
    await prisma.team.upsert({
      where: { key: team.key },
      update: { name: team.name, description: team.description },
      create: team,
    });
  }

  const teams = await prisma.team.findMany();
  const byKey = Object.fromEntries(teams.map((t) => [t.key, t]));

  const channels: { key: ChannelKey; name: string; teamKey?: TeamKey; isPrivate: boolean }[] = [
    { key: "GENERAL", name: "General", isPrivate: false },
    { key: "ADMIN", name: "Admins", isPrivate: true },
    { key: "VIDEO_CREATOR", name: "AP Video Creators", teamKey: "VIDEO_CREATOR", isPrivate: true },
    { key: "SCRIPT_WRITER", name: "Script Writers", teamKey: "SCRIPT_WRITER", isPrivate: true },
    { key: "VIDEO_EDITOR", name: "Video Editors", teamKey: "VIDEO_EDITOR", isPrivate: true },
    { key: "SOCIAL_MEDIA", name: "Social Media", teamKey: "SOCIAL_MEDIA", isPrivate: true },
    { key: "GRAPHIC_DESIGN", name: "Graphic Design", teamKey: "GRAPHIC_DESIGN", isPrivate: true },
    { key: "FIVE_FOR_FIVE", name: "5 For 5", teamKey: "FIVE_FOR_FIVE", isPrivate: true },
  ];

  for (const ch of channels) {
    await prisma.messageChannel.upsert({
      where: { key: ch.key },
      update: { name: ch.name, isPrivate: ch.isPrivate },
      create: {
        key: ch.key,
        name: ch.name,
        isPrivate: ch.isPrivate,
        slug: ch.key,
        kind: "TEAM" as const,
        teamId: ch.teamKey ? byKey[ch.teamKey].id : undefined,
      },
    });
  }

  for (const [index, subject] of SUBJECTS.entries()) {
    await prisma.apSubject.upsert({
      where: { slug: subject.slug },
      update: {
        name: subject.name,
        color: subject.color,
        ink: subject.ink,
        shortName: subject.short,
        icon: subject.icon,
        sortOrder: index,
        active: true,
      },
      create: {
        slug: subject.slug,
        name: subject.name,
        color: subject.color,
        ink: subject.ink,
        shortName: subject.short,
        icon: subject.icon,
        sortOrder: index,
      },
    });
  }

  await prisma.orgSettings.upsert({
    where: { id: "org" },
    update: {},
    create: {
      id: "org",
      founderName: process.env.FOUNDER_NAME ?? "Kesav Garg",
      contactEmail: process.env.FOUNDER_EMAIL ?? "kesavgarg@gmail.com",
      founderBio:
        "Student founder building AP Blitz so studying for APs actually feels doable — and a little less lonely.",
    },
  });

  const founderEmail = (process.env.FOUNDER_EMAIL ?? "kesavgarg@gmail.com").toLowerCase();
  const founderName = (process.env.FOUNDER_NAME ?? "Kesav Garg").split(" ");
  const founderPassword = process.env.FOUNDER_PASSWORD?.trim() ?? "";
  if (
    founderPassword.length < 12 ||
    founderPassword.toLowerCase() === "change-me" ||
    !/[A-Za-z]/.test(founderPassword) ||
    !/[0-9]/.test(founderPassword)
  ) {
    throw new Error("Set FOUNDER_PASSWORD to a unique password of at least 12 characters. The seed default change-me is refused.");
  }
  const passwordHash = await bcrypt.hash(founderPassword, 12);

  const founder = await prisma.user.upsert({
    where: { email: founderEmail },
    update: {
      role: PermissionRole.FOUNDER,
      isActive: true,
      firstName: founderName[0] ?? "Kesav",
      lastName: founderName.slice(1).join(" ") || "Garg",
      ...(process.env.SEED_RESET_FOUNDER_PASSWORD === "1" ? { passwordHash } : {}),
    },
    create: {
      email: founderEmail,
      firstName: founderName[0] ?? "Kesav",
      lastName: founderName.slice(1).join(" ") || "Garg",
      passwordHash,
      role: PermissionRole.FOUNDER,
      phone: "+1 (404) 213-9019",
    },
  });

  for (const team of teams) {
    await prisma.teamMembership.upsert({
      where: { userId_teamId: { userId: founder.id, teamId: team.id } },
      update: { isLeader: true },
      create: { userId: founder.id, teamId: team.id, isLeader: true },
    });
  }

  await prisma.task.deleteMany({
    where: {
      OR: [{ title: "Draft Gilded Age 60s script" }, { contentItem: { contentId: "C-0001" } }],
    },
  });
  await prisma.fileAsset.deleteMany({ where: { contentItem: { contentId: "C-0001" } } });
  await prisma.designRequest.deleteMany({ where: { contentItem: { contentId: "C-0001" } } });
  await prisma.calendarEvent.deleteMany({
    where: {
      OR: [{ title: "Weekly AP Blitz standup" }, { contentItem: { contentId: "C-0001" } }],
    },
  });
  await prisma.contentItem.deleteMany({ where: { contentId: "C-0001" } });
  await prisma.application.deleteMany({ where: { email: "priya.shah@example.com" } });
  await prisma.meeting.deleteMany({ where: { title: "Weekly AP Blitz standup" } });
  await prisma.calendarEvent.deleteMany({ where: { title: "Weekly AP Blitz standup" } });
  await prisma.announcement.deleteMany({
    where: { title: "Welcome to the AP Blitz workspace" },
  });
  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@apblitz.local" } },
    select: { id: true },
  });
  const demoIds = demoUsers.map((u) => u.id);
  if (demoIds.length) {
    await prisma.activityLog.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.dailyLog.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.message.deleteMany({ where: { authorId: { in: demoIds } } });
    await prisma.task.deleteMany({
      where: { OR: [{ assigneeId: { in: demoIds } }, { creatorId: { in: demoIds } }] },
    });
    await prisma.script.deleteMany({ where: { authorId: { in: demoIds } } });
    await prisma.socialIdea.deleteMany({ where: { authorId: { in: demoIds } } });
    await prisma.fileAsset.deleteMany({ where: { uploadedById: { in: demoIds } } });
    await prisma.meeting.deleteMany({ where: { hostId: { in: demoIds } } });
    await prisma.announcement.deleteMany({ where: { authorId: { in: demoIds } } });
    await prisma.contentItem.updateMany({
      where: { ownerId: { in: demoIds } },
      data: { ownerId: null },
    });
    await prisma.calendarEvent.updateMany({
      where: { createdById: { in: demoIds } },
      data: { createdById: null },
    });
    await prisma.user.deleteMany({ where: { id: { in: demoIds } } });
  }

  const org = await prisma.orgSettings.findUnique({ where: { id: "org" } });
  if (org && !org.stagesBackfilled) {
    const items = await prisma.contentItem.findMany({ select: { id: true, status: true, completedAt: true } });
    for (const item of items) {
      const stage = stageFromStatus(item.status);
      await prisma.contentItem.update({
        where: { id: item.id },
        data: {
          stage,
          completedAt: stage === "COMPLETED" ? item.completedAt ?? new Date() : item.completedAt,
        },
      });
    }
    await prisma.orgSettings.update({ where: { id: "org" }, data: { stagesBackfilled: true } });
  }

  console.log("Seed complete.");
  console.log(`Founder login: ${founderEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
