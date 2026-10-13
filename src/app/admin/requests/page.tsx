import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { setRequestStatusAction } from "@/actions/library";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  await requireAdmin();
  const [requests, videos] = await Promise.all([
    prisma.videoRequest.findMany({
      include: { subject: true, user: true, video: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.libraryVideo.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" } }),
  ]);
  return (
    <div>
      <h1 className="font-display text-4xl">Video requests</h1>
      <p className="mt-2 text-sm text-paper/60">These come from Blitzer accounts, not team applications.</p>
      <div className="mt-6 space-y-3">
        {requests.map((request) => (
          <article key={request.id} className="rounded-3xl border border-white/10 bg-navy p-5">
            <p className="text-xs text-volt">{request.subject.name} · {request.status}</p>
            <h2 className="font-display text-2xl">{request.unit}</h2>
            <p className="mt-2 text-sm text-paper/80">{request.prompt}</p>
            {request.details ? <p className="mt-2 text-sm text-paper/60">{request.details}</p> : null}
            <p className="mt-2 text-xs text-paper/40">{request.user.firstName} {request.user.lastName} · {formatDateTime(request.createdAt)}</p>
            <form action={setRequestStatusAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={request.id} />
              <select name="status" defaultValue={request.status} className="rounded-xl bg-ink px-2 py-1 text-sm">
                <option value="NEW">New</option>
                <option value="PLANNED">Planned</option>
                <option value="COMPLETED">Completed</option>
                <option value="DECLINED">Declined</option>
              </select>
              <select name="videoId" defaultValue={request.videoId || ""} className="rounded-xl bg-ink px-2 py-1 text-sm">
                <option value="">No linked video</option>
                {videos.map((video) => <option key={video.id} value={video.id}>{video.title}</option>)}
              </select>
              <button className="rounded-full bg-volt px-3 py-1 text-sm font-semibold text-ink">Update</button>
            </form>
          </article>
        ))}
        {requests.length === 0 ? <p className="text-sm text-paper/50">No requests yet.</p> : null}
      </div>
    </div>
  );
}
