import { prisma } from "@/lib/prisma";
import { requireFounder } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  await requireFounder();
  const rows = await prisma.feedbackSubmission.findMany({
    include: { user: true, subject: true, video: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Blitzer feedback</h1>
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl border border-white/10 bg-navy p-5">
            <p className="text-xs uppercase tracking-wide text-volt">{row.kind}{row.subject ? ` · ${row.subject.name}` : ""}</p>
            <p className="mt-2 text-paper/85">{row.message}</p>
            <p className="mt-2 text-xs text-paper/45">
              {row.user.firstName} {row.user.lastName} · {formatDateTime(row.createdAt)}
              {row.video ? ` · ${row.video.title}` : ""}
            </p>
          </article>
        ))}
        {rows.length === 0 ? <p className="text-sm text-paper/50">No feedback yet.</p> : null}
      </div>
    </div>
  );
}
