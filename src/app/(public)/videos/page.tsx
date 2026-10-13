import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listSubjects } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { SubjectCard } from "@/components/public/subject-card";
import { VideoCard } from "@/components/public/video-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Watch videos" };

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string }>;
}) {
  const { q, subject } = await searchParams;
  const query = (q || "").trim();
  const [subjects, user] = await Promise.all([listSubjects(), getSessionUser()]);
  const publishedWhere = {
    status: "PUBLISHED" as const,
    ...(subject ? { subject: { slug: subject } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
            { unit: { contains: query, mode: "insensitive" as const } },
            { tags: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [recent, popularRaw, continueWatching] = await Promise.all([
    prisma.libraryVideo.findMany({
      where: publishedWhere,
      include: { subject: true },
      orderBy: { publishedAt: "desc" },
      take: 12,
    }),
    prisma.libraryVideo.findMany({
      where: { status: "PUBLISHED", viewCount: { gt: 0 } },
      include: { subject: true },
      orderBy: { viewCount: "desc" },
      take: 6,
    }),
    user?.role === "BLITZER"
      ? prisma.watchProgress.findMany({
          where: { userId: user.id, video: { status: "PUBLISHED" } },
          include: { video: { include: { subject: true } } },
          orderBy: { updatedAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Video library</p>
      <h1 className="mt-3 font-display text-5xl leading-none">Watch AP videos</h1>
      <p className="mt-3 max-w-2xl text-paper/70">
        Every published video lands in the subject it was saved with. {subjects.length} AP subjects are set up.
      </p>
      {!user ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm">
          Watching is free. <Link href="/register" className="font-semibold text-volt">Become a Blitzer</Link> to save videos, pick your classes, and request topics.
        </p>
      ) : null}

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/videos">
        <label className="sr-only" htmlFor="video-search">Search videos</label>
        <input
          id="video-search"
          name="q"
          defaultValue={query}
          placeholder="Search titles, units, tags"
          className="w-full rounded-full border border-white/10 bg-black/50 px-5 py-3 outline-none"
        />
        <button className="rounded-full bg-volt px-5 py-3 font-semibold text-ink">Search</button>
      </form>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <Link href="/videos" className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${!subject ? "bg-volt text-ink" : "border border-white/15"}`}>
          All subjects
        </Link>
        {subjects.map((item) => (
          <Link
            key={item.id}
            href={`/videos?subject=${item.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold"
            style={
              subject === item.slug
                ? { backgroundColor: item.color, color: item.ink }
                : { border: `1px solid ${item.color}`, color: item.color }
            }
          >
            {item.shortName}
          </Link>
        ))}
      </div>

      {continueWatching.length ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl">Continue watching</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {continueWatching.map((row) => (
              <VideoCard key={row.id} video={row.video} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-3xl">Recently added</h2>
        {recent.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No published videos match that yet.</p>
        )}
      </section>

      {popularRaw.length ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl">Popular</h2>
          <p className="mt-1 text-sm text-muted">Ordered by actual views on AP Blitz.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularRaw.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-3xl">Browse all subjects</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((item) => (
            <SubjectCard
              key={item.id}
              href={`/videos/${item.slug}`}
              name={item.name}
              color={item.color}
              ink={item.ink}
              icon={item.icon}
              count={item.videoCount}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
