import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { bootCatalog } from "@/lib/catalog";
import { VideoCard } from "@/components/public/video-card";
import { BlitzerPrompt } from "@/components/public/blitzer-prompt";

export const dynamic = "force-dynamic";

export default async function SubjectVideosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; unit?: string }>;
}) {
  await bootCatalog();
  const user = await getSessionUser();
  const { slug } = await params;
  const { q, unit } = await searchParams;
  const subject = await prisma.apSubject.findFirst({ where: { slug, active: true } });
  if (!subject) notFound();
  const query = (q || "").trim();
  const videos = await prisma.libraryVideo.findMany({
    where: {
      status: "PUBLISHED",
      promotional: false,
      subjectId: subject.id,
      ...(unit ? { unit } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { unit: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { subject: true },
    orderBy: { publishedAt: "desc" },
  });
  const units = [
    ...new Set(
      (
        await prisma.libraryVideo.findMany({
          where: { status: "PUBLISHED", promotional: false, subjectId: subject.id, unit: { not: null } },
          select: { unit: true },
        })
      )
        .map((row) => row.unit)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  return (
    <BlitzerPrompt ask={user?.role !== "BLITZER"} limited={!user}>
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <Link href="/videos" className="text-sm text-paper/60">
        All videos
      </Link>
      <div className="mt-4 rounded-[1.8rem] p-6" style={{ backgroundColor: subject.color, color: subject.ink }}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">{videos.length} published</p>
        <h1 className="mt-2 font-display text-5xl leading-none">{subject.name}</h1>
      </div>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" action={`/videos/${subject.slug}`}>
        <input name="q" defaultValue={query} placeholder={`Search ${subject.shortName}`} className="w-full rounded-full border border-white/10 bg-black/50 px-5 py-3" />
        <button className="rounded-full bg-volt px-5 py-3 font-semibold text-ink">Search</button>
      </form>
      {units.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/videos/${subject.slug}`} className="rounded-full border border-white/15 px-3 py-1 text-sm">All units</Link>
          {units.map((item) => (
            <Link
              key={item}
              href={`/videos/${subject.slug}?unit=${encodeURIComponent(item)}`}
              className="rounded-full px-3 py-1 text-sm font-semibold"
              style={{ backgroundColor: subject.color, color: subject.ink }}
            >
              {item}
            </Link>
          ))}
        </div>
      ) : null}

      {videos.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nothing published in this subject yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
    </BlitzerPrompt>
  );
}
