import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VideoCard } from "@/components/public/video-card";
import { toggleSavedVideoAction } from "@/actions/student";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await requireUser();
  const saved = await prisma.savedVideo.findMany({
    where: { userId: user.id, video: { status: "PUBLISHED" } },
    include: { video: { include: { subject: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Saved videos</h1>
      {saved.length === 0 ? <p className="mt-3 text-paper/60">Save a video from its watch page and it will stay here.</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {saved.map((row) => (
          <div key={row.id}>
            <VideoCard video={row.video} />
            <form action={toggleSavedVideoAction} className="mt-2">
              <input type="hidden" name="videoId" value={row.videoId} />
              <button className="text-sm text-paper/60">Remove</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
