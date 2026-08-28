import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFounder, leadsTeam, onTeam, requireUser } from "@/lib/auth";
import { claimEdit, reviewEdit, submitEdit } from "@/actions/content";

export default async function EditWorkspace() {
  const user = await requireUser();
  if (!onTeam(user, "VIDEO_EDITOR") && !isFounder(user)) notFound();
  const videos = await prisma.video.findMany({
    where: {
      OR: [
        { editorStatus: { in: ["waiting", "editing", "submitted", "needs_revision"] } },
        { editorId: user.id },
      ],
    },
    include: { contentItem: { include: { script: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const canReview = isFounder(user) || leadsTeam(user, "VIDEO_EDITOR");

  return (
    <div>
      <h1 className="font-display text-4xl">Video editor</h1>
      <div className="mt-6 space-y-4">
        {videos.map((v) => (
          <article key={v.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase text-ink/40">
              {v.contentItem.contentId} · {v.editorStatus.replace("_", " ")}
            </p>
            <h2 className="font-display text-2xl">{v.contentItem.title}</h2>
            {v.contentItem.script ? (
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#f7f3eb] p-4 text-sm">
                {v.contentItem.script.body}
              </pre>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              {v.rawFileId ? (
                <a className="rounded-full border px-4 py-2 text-sm" href={`/api/files/${v.rawFileId}`}>
                  Download source
                </a>
              ) : null}
              {v.editedFileId ? (
                <a className="rounded-full border px-4 py-2 text-sm" href={`/api/files/${v.editedFileId}`}>
                  Download edit
                </a>
              ) : null}
              {v.editorStatus === "waiting" ? (
                <form action={claimEdit}>
                  <input type="hidden" name="id" value={v.id} />
                  <button className="rounded-full bg-ink px-4 py-2 text-paper">Accept video</button>
                </form>
              ) : null}
              <form action={submitEdit} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={v.id} />
                <input type="file" name="file" accept="video/*" />
                <input name="notes" placeholder="Editing notes" className="rounded-xl border px-3 py-2 text-sm" />
                <button className="rounded-full border px-4 py-2 text-sm">Upload final edit</button>
              </form>
              {canReview && v.editorStatus === "submitted" ? (
                <form action={reviewEdit} className="flex gap-2">
                  <input type="hidden" name="id" value={v.id} />
                  <button name="decision" value="approve" className="rounded-full bg-ink px-3 py-1 text-sm text-paper">
                    Approve
                  </button>
                  <button name="decision" value="revise" className="rounded-full border px-3 py-1 text-sm">
                    Needs revision
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
