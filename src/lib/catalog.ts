import "server-only";
import { prisma } from "@/lib/prisma";
import { SUBJECTS } from "@/lib/subjects";
import { stageFromStatus } from "@/lib/stages";

let boot: Promise<void> | null = null;

async function ensureSubjects() {
  const rows = await prisma.apSubject.findMany({
    select: { slug: true, name: true, color: true, ink: true, shortName: true, icon: true },
  });
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  for (const [index, subject] of SUBJECTS.entries()) {
    const current = bySlug.get(subject.slug);
    if (
      current &&
      current.name === subject.name &&
      current.color === subject.color &&
      current.ink === subject.ink &&
      current.shortName === subject.short &&
      current.icon === subject.icon
    ) {
      continue;
    }
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
}

async function backfillStagesOnce() {
  const settings = await prisma.orgSettings.findUnique({ where: { id: "org" } });
  if (!settings || settings.stagesBackfilled) return;
  const items = await prisma.contentItem.findMany({
    select: { id: true, status: true, completedAt: true },
  });
  for (const item of items) {
    const stage = stageFromStatus(item.status);
    await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        stage,
        completedAt: stage === "COMPLETED" ? (item.completedAt ?? new Date()) : item.completedAt,
      },
    });
  }
  await prisma.orgSettings.update({
    where: { id: "org" },
    data: { stagesBackfilled: true },
  });
}

export function bootCatalog() {
  if (!boot) {
    boot = (async () => {
      await ensureSubjects();
      await backfillStagesOnce();
    })().catch((err) => {
      boot = null;
      throw err;
    });
  }
  return boot;
}

export async function listSubjects() {
  await bootCatalog();
  const rows = await prisma.apSubject.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { videos: { where: { status: "PUBLISHED", promotional: false } } } },
    },
  });
  return rows.map((row) => ({ ...row, videoCount: row._count.videos }));
}
