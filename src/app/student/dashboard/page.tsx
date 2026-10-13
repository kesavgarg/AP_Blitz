import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listSubjects } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { SubjectCard } from "@/components/public/subject-card";
import { VideoCard } from "@/components/public/video-card";
import { flushScheduledAnnouncements } from "@/lib/announcements";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const user = await requireUser();
  await flushScheduledAnnouncements();
  const [subjects, classes, recent, saved, watched] = await Promise.all([
    listSubjects(),
    prisma.studentClass.findMany({
      where: { userId: user.id },
      include: { subject: true },
    }),
    prisma.libraryVideo.findMany({
      where: { status: "PUBLISHED" },
      include: { subject: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.savedVideo.findMany({
      where: { userId: user.id, video: { status: "PUBLISHED" } },
      include: { video: { include: { subject: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.watchProgress.findMany({
      where: { userId: user.id, video: { status: "PUBLISHED" } },
      include: { video: { include: { subject: true } } },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);
  const slugs = classes.map((row) => row.subject.slug);
  const announcements = await prisma.announcement.findMany({
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
    take: 3,
  });
  const selected = new Set(classes.map((row) => row.subjectId));
  const mine = subjects.filter((subject) => selected.has(subject.id));
  const suggested = recent.filter((video) => selected.has(video.subjectId)).slice(0, 3);

  return (
    <div>
      <h1 className="font-display text-4xl md:text-5xl">Welcome back, {user.firstName}!</h1>
      <p className="mt-2 text-paper/70">
        AP Blitz currently offers {subjects.length} subjects and {subjects.reduce((sum, subject) => sum + subject.videoCount, 0)} published videos.
      </p>
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">My AP classes</h2>
          <Link href="/student/classes" className="text-sm text-volt">Edit</Link>
        </div>
        {mine.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mine.map((subject) => (
              <SubjectCard key={subject.id} href={`/videos/${subject.slug}`} name={subject.name} color={subject.color} ink={subject.ink} icon={subject.icon} count={subject.videoCount} badge="My class" />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-paper/60">Pick the APs you are taking so this page leads with those videos.</p>
        )}
      </section>
      <section className="mt-10">
        <h2 className="font-display text-3xl">Recently added</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recent.map((video) => <VideoCard key={video.id} video={video} />)}
        </div>
        {recent.length === 0 ? <p className="mt-3 text-sm text-paper/60">No published videos yet.</p> : null}
      </section>
      {suggested.length ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl">Suggested for your classes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {suggested.map((video) => <VideoCard key={video.id} video={video} />)}
          </div>
        </section>
      ) : null}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <List title="Saved videos" empty="Nothing saved yet." href="/student/saved" items={saved.map((row) => ({ href: `/videos/watch/${row.video.id}`, label: row.video.title }))} />
        <List title="Recently watched" empty="Open a timestamp in a video to start a trail." href="/videos" items={watched.map((row) => ({ href: `/videos/watch/${row.video.id}`, label: row.video.title }))} />
        <List title="Announcements" empty="No student announcements yet." href="/student/announcements" items={announcements.map((row) => ({ href: "/student/announcements", label: row.title }))} />
      </div>
    </div>
  );
}

function List({ title, items, empty, href }: { title: string; items: { href: string; label: string }[]; empty: string; href: string }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        <Link href={href} className="text-xs text-volt">Open</Link>
      </div>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.label}><Link href={item.href} className="hover:text-volt">{item.label}</Link></li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-paper/50">{empty}</p>}
    </section>
  );
}
