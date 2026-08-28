import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastToTeam } from "@/actions/messages";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  await requireAdmin();
  const { sent } = await searchParams;
  const announcements = await prisma.announcement.findMany({
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form action={broadcastToTeam} className="rounded-3xl border border-white/10 bg-navy p-6">
        <h1 className="font-display text-4xl">Message the team</h1>
        <p className="mt-2 text-sm text-paper/60">
          This posts to <strong># General</strong> (every member can see it), pins it on their
          workspace home, and sends them an in-app alert.
        </p>
        {sent ? (
          <p className="mt-3 rounded-xl bg-volt/15 px-3 py-2 text-sm text-volt">
            Sent. Members will see it in Messages → # General and on their workspace home.
          </p>
        ) : null}
        <input
          name="title"
          required
          placeholder="Title"
          className="mt-5 w-full rounded-xl bg-ink px-3 py-2"
        />
        <textarea
          name="body"
          required
          rows={8}
          placeholder="What does the team need to know?"
          className="mt-3 w-full rounded-xl bg-ink px-3 py-2"
        />
        <button className="mt-4 rounded-full bg-volt px-5 py-2 font-semibold text-ink">
          Send to everyone
        </button>
      </form>
      <section className="rounded-3xl border border-white/10 bg-navy p-6">
        <h2 className="font-display text-2xl">Recent broadcasts</h2>
        {announcements.length === 0 ? (
          <p className="mt-4 text-sm text-paper/50">Nothing sent yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {announcements.map((a) => (
              <article key={a.id} className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="font-medium">{a.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-paper/70">{a.body}</p>
                <p className="mt-2 text-xs text-paper/40">
                  {a.author.firstName} · {formatDateTime(a.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
