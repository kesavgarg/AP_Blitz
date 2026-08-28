import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFounder, onTeam, requireUser } from "@/lib/auth";
import { acceptVideoAssignment, submitRawVideo } from "@/actions/content";
import { formatDate } from "@/lib/utils";

export default async function VideoWorkspace() {
  const user = await requireUser();
  if (!onTeam(user, "VIDEO_CREATOR") && !isFounder(user)) notFound();
  const videos = await prisma.video.findMany({
    where: isFounder(user) ? undefined : { creatorId: user.id },
    include: { contentItem: { include: { script: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-4xl">Video creator</h1>
      <p className="mt-2 text-ink/60">Approved scripts assigned to you live here.</p>
      <div className="mt-6 space-y-4">
        {videos.map((v) => (
          <article key={v.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase text-ink/40">
              {v.contentItem.contentId} · {v.creatorStatus}
            </p>
            <h2 className="font-display text-2xl">{v.contentItem.title}</h2>
            <p className="text-sm text-ink/50">
              {v.contentItem.apSubject} {v.contentItem.apUnit} · assigned{" "}
              {v.assignedAt ? formatDate(v.assignedAt) : "—"}
              {v.contentItem.deadline ? ` · due ${formatDate(v.contentItem.deadline)}` : ""}
            </p>
            {v.contentItem.notes ? <p className="mt-2 text-sm">{v.contentItem.notes}</p> : null}
            {v.contentItem.script ? (
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#f7f3eb] p-4 text-sm">
                {v.contentItem.script.body}
              </pre>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              {v.creatorStatus === "assigned" ? (
                <form action={acceptVideoAssignment}>
                  <input type="hidden" name="id" value={v.id} />
                  <button className="rounded-full bg-ink px-4 py-2 text-paper">Accept assignment</button>
                </form>
              ) : null}
              <form action={submitRawVideo} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={v.id} />
                <input type="file" name="file" accept="video/*" />
                <input name="notes" placeholder="Notes" className="rounded-xl border px-3 py-2 text-sm" />
                <button className="rounded-full border px-4 py-2 text-sm">Upload + submit</button>
              </form>
            </div>
          </article>
        ))}
        {!videos.length ? <p className="text-ink/50">No scripts assigned yet.</p> : null}
      </div>
    </div>
  );
}
