import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEducationalVideoTaker } from "@/lib/one-time";
import { submitRawVideo } from "@/actions/content";

export const dynamic = "force-dynamic";

function remainingLabel(deadline: Date) {
  const ms = deadline.getTime() - Date.now();
  if (ms <= 0) return "Time is up";
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days >= 7) return "1 week remaining to work";
  if (days === 1) return "1 day remaining to work";
  return `${days} days remaining to work`;
}

export default async function AcceptedScriptsPage() {
  const user = await requireTeam();
  if (!(await isEducationalVideoTaker(user.id, user.role))) notFound();
  const videos = await prisma.video.findMany({
    where: { creatorId: user.id },
    include: { contentItem: { include: { script: true } } },
    orderBy: { assignedAt: "desc" },
  });
  const soonest = videos
    .map((video) => video.contentItem.deadline)
    .filter((deadline): deadline is Date => Boolean(deadline))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-ink">Accepted</h1>
      {videos.length ? (
        <p className="mt-3 font-display text-2xl text-ink">
          {soonest ? remainingLabel(soonest) : "1 week remaining to work"}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-ink/60">The week starts when you accept a script.</p>
      <div className="mt-6 space-y-4">
        {videos.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing accepted yet. Pick a script first.</p>
        ) : null}
        {videos.map((video) => (
          <article key={video.id} className="rounded-3xl bg-white p-5">
            <p className="text-sm text-ink/50">
              {video.contentItem.deadline ? remainingLabel(video.contentItem.deadline) : "1 week remaining to work"}
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">{video.contentItem.title}</h2>
            <p className="mt-1 text-sm text-ink/50">
              {video.contentItem.apSubject} {video.contentItem.apUnit}
            </p>
            {video.contentItem.script ? (
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-black/5 p-4 text-sm text-ink">
                {video.contentItem.script.body}
              </pre>
            ) : null}
            <form action={submitRawVideo} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={video.id} />
              <input type="file" name="file" accept="video/*" />
              <input name="notes" placeholder="Notes" className="rounded-xl border border-black/10 px-3 py-2 text-sm" />
              <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">Upload the video</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
