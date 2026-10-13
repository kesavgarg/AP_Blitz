import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { flushScheduledAnnouncements } from "@/lib/announcements";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentAnnouncementsPage() {
  const user = await requireUser();
  await flushScheduledAnnouncements();
  const classes = await prisma.studentClass.findMany({
    where: { userId: user.id },
    include: { subject: true },
  });
  const slugs = classes.map((row) => row.subject.slug);
  const rows = await prisma.announcement.findMany({
    where: {
      archivedAt: null,
      AND: [
        { OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }] },
        {
          OR: [
            { audience: { in: ["BLITZERS", "EVERYONE"] } },
            ...(slugs.length ? [{ audience: "SUBJECT" as const, subjectSlug: { in: slugs } }] : []),
          ],
        },
      ],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Announcements</h1>
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl border border-white/10 bg-black/30 p-5">
            <h2 className="font-display text-2xl">{row.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-paper/80">{row.body}</p>
            <p className="mt-3 text-xs text-paper/45">{formatDateTime(row.createdAt)} · {row.audience.toLowerCase()}</p>
          </article>
        ))}
        {rows.length === 0 ? <p className="text-sm text-paper/50">No announcements for Blitzers yet.</p> : null}
      </div>
    </div>
  );
}
