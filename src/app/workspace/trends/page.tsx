import { prisma } from "@/lib/prisma";
import { isAdmin, requireTeam } from "@/lib/auth";
import { addTrendLink, claimTrendLink, deleteTrendLink } from "@/actions/trends";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const user = await requireTeam();
  const trends = await prisma.trendLink.findMany({
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      claimedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-4xl text-ink">Trends</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/60">
        Drop a link when you see something worth making. Someone can accept it and open it on Instagram.
      </p>
      <form action={addTrendLink} className="mt-6 grid gap-3 rounded-3xl bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <input name="url" required placeholder="https://www.instagram.com/..." className="rounded-xl border border-black/10 px-3 py-2" />
        <input name="note" placeholder="What is the trend?" className="rounded-xl border border-black/10 px-3 py-2" />
        <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Add link</button>
      </form>
      <div className="mt-6 space-y-3">
        {trends.length === 0 ? <p className="text-sm text-ink/50">No trends yet.</p> : null}
        {trends.map((trend) => (
          <article key={trend.id} className="rounded-3xl bg-white p-4">
            <p className="text-sm text-ink/50">
              Added by {trend.createdBy.firstName} {trend.createdBy.lastName}
            </p>
            {trend.note ? <p className="mt-1 font-medium">{trend.note}</p> : null}
            <a href={trend.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-sm font-semibold text-volt">
              Open on Instagram
            </a>
            <div className="mt-3 flex flex-wrap gap-2">
              {trend.claimedBy ? (
                <p className="text-sm">Accepted by {trend.claimedBy.firstName} {trend.claimedBy.lastName}</p>
              ) : (
                <form action={claimTrendLink}>
                  <input type="hidden" name="id" value={trend.id} />
                  <button className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">Accept this</button>
                </form>
              )}
              {isAdmin(user) ? (
                <form action={deleteTrendLink}>
                  <input type="hidden" name="id" value={trend.id} />
                  <button className="rounded-full border border-coral/40 px-4 py-2 text-sm text-coral">Remove</button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
