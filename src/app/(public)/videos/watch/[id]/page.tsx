import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { WatchPlayer } from "@/components/public/watch-player";
import { ViewRecorder } from "@/components/public/view-recorder";
import { GuestWatchClaim, RegisterToWatchMore } from "@/components/public/guest-watch";
import { toggleSavedVideoAction } from "@/actions/student";
import { formatTimestamp } from "@/lib/videos";
import { formatDate } from "@/lib/utils";
import { GUEST_VIDEO_COOKIE, guestVideoFromCookie } from "@/lib/guest-watch";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await prisma.libraryVideo.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      subject: true,
      chapters: { orderBy: [{ sortOrder: "asc" }, { seconds: "asc" }] },
    },
  });
  if (!video) notFound();
  const user = await getSessionUser();
  const guestVideo = user ? null : guestVideoFromCookie((await cookies()).get(GUEST_VIDEO_COOKIE)?.value);
  const blocked = Boolean(guestVideo && guestVideo !== video.id);
  const saved = user?.role === "BLITZER"
    ? await prisma.savedVideo.findUnique({ where: { userId_videoId: { userId: user.id, videoId: video.id } } })
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      {blocked ? null : <ViewRecorder videoId={video.id} />}
      <Link href={`/videos/${video.subject.slug}`} className="text-sm font-semibold" style={{ color: video.subject.color }}>
        {video.subject.name}
      </Link>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{video.title}</h1>
      <p className="mt-2 text-sm text-paper/60">
        {video.publishedAt ? `Published ${formatDate(video.publishedAt)}` : "Published"}
        {video.durationSeconds ? ` · ${formatTimestamp(video.durationSeconds)}` : ""}
        {video.viewCount ? ` · ${video.viewCount} views` : ""}
      </p>
      {video.description ? <p className="mt-4 max-w-3xl text-paper/80">{video.description}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {user?.role === "BLITZER" ? (
          <form action={toggleSavedVideoAction}>
            <input type="hidden" name="videoId" value={video.id} />
            <button className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">
              {saved ? "Remove from saved" : "Save video"}
            </button>
          </form>
        ) : (
          <Link href="/register" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
            Become a Blitzer to save this
          </Link>
        )}
        {blocked ? null : (
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
            Open on {video.platform}
          </a>
        )}
      </div>
      <div className="mt-8">
        {blocked ? (
          <RegisterToWatchMore />
        ) : (
          <>
            {user ? null : <GuestWatchClaim videoId={video.id} />}
            <WatchPlayer
              videoId={video.id}
              title={video.title}
              url={video.url}
              platform={video.platform}
              chapters={video.chapters}
              canSaveProgress={user?.role === "BLITZER"}
            />
          </>
        )}
      </div>
    </div>
  );
}
