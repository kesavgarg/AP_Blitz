import { requireUser } from "@/lib/auth";
import { listSubjects } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { RequestForm } from "@/components/student/request-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const user = await requireUser();
  const [subjects, mine] = await Promise.all([
    listSubjects(),
    prisma.videoRequest.findMany({
      where: { userId: user.id },
      include: { subject: true, video: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h1 className="font-display text-4xl">Requests</h1>
        <p className="mt-2 text-sm text-paper/70">Ask for a topic. It goes to the AP Blitz admins, not the team application queue.</p>
        <div className="mt-5">
          <RequestForm subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))} />
        </div>
      </div>
      <div>
        <h2 className="font-display text-2xl">Your requests</h2>
        <div className="mt-4 space-y-3">
          {mine.map((request) => (
            <article key={request.id} className="rounded-3xl border border-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: request.subject.color }}>{request.subject.name}</p>
              <h3 className="mt-1 font-display text-xl">{request.unit}</h3>
              <p className="mt-2 text-sm text-paper/75">{request.prompt}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-paper/50">{request.status}</p>
              {request.video ? <Link href={`/videos/watch/${request.video.id}`} className="mt-2 inline-block text-sm text-volt">Watch the video</Link> : null}
            </article>
          ))}
          {mine.length === 0 ? <p className="text-sm text-paper/50">No requests yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
