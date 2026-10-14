import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { VideoCard } from "@/components/public/video-card";
import { BlitzerPrompt } from "@/components/public/blitzer-prompt";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotional" };

export default async function PromotionalVideosPage() {
  const user = await getSessionUser();
  const videos = await prisma.libraryVideo.findMany({
    where: { status: "PUBLISHED", promotional: true },
    include: { subject: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <BlitzerPrompt ask={user?.role !== "BLITZER"} limited={!user}>
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <Link href="/videos" className="text-sm text-paper/60">All videos</Link>
        <div className="mt-4 overflow-hidden rounded-[1.8rem] bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-promotional.png" alt="AP Blitz Promotional" className="max-h-72 w-full object-cover" />
        </div>
        <h1 className="mt-6 font-display text-5xl">Promotional</h1>
        <p className="mt-2 text-paper/70">{videos.length} {videos.length === 1 ? "video" : "videos"}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </BlitzerPrompt>
  );
}
