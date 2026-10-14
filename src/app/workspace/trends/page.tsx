import { prisma } from "@/lib/prisma";
import { isAdmin, requireTeam } from "@/lib/auth";
import { addTrendLink, claimTrendLink, deleteTrendLink, updateTrendDescription } from "@/actions/trends";
import { isOneTimeMember } from "@/lib/one-time";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const user = await requireTeam();
  const oneTime = await isOneTimeMember(user.id, user.role);
  const trends = await prisma.trendLink.findMany({
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      claimedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const picked = oneTime ? trends.find((trend) => trend.claimedById === user.id) : null;
  const deadline = oneTime ? new Date(oneTime.acceptedAt.getTime() + 5 * 24 * 60 * 60 * 1000) : null;

  return (
    <div>
      {oneTime ? (
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl text-ink">Video ideas</h1>
          <p className="mt-4 font-display text-2xl uppercase tracking-wide">Videos to make. Pick one.</p>
          <p className="mt-3 text-sm">
            Make that video, then send it to Kesav Garg at{" "}
            <a className="font-semibold text-volt" href="tel:+14042139019">+1 (404) 213-9019</a>.
          </p>
          <p className="mt-2 text-sm text-ink/70">
            You only get 5 days{deadline ? `. Send it by ${formatDate(deadline)}` : ""}.
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-display text-4xl text-ink">Trends</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">
            Drop a link when you see something worth making. Someone can accept it and open it on Instagram.
          </p>
        </>
      )}
      {oneTime ? null : (
      <form action={addTrendLink} className="mt-6 grid gap-3 rounded-3xl bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input name="url" required placeholder="https://www.instagram.com/..." className="rounded-xl border border-black/10 px-3 py-2" />
          <input name="note" placeholder="What is the trend?" className="rounded-xl border border-black/10 px-3 py-2" />
          <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Add link</button>
        </div>
        <textarea name="description" rows={3} placeholder="Description for this one — anything they need to know" className="rounded-xl border border-black/10 px-3 py-2" />
      </form>
      )}
      <div className="mt-6 space-y-3">
        {trends.length === 0 ? <p className="text-sm text-ink/50">No trends yet.</p> : null}
        {trends.map((trend) => (
          <article key={trend.id} className="rounded-3xl bg-white p-4">
            <p className="text-sm text-ink/50">
              Added by {trend.createdBy.firstName} {trend.createdBy.lastName}
            </p>
            {trend.note ? <p className="mt-1 font-medium">{trend.note}</p> : null}
            {oneTime && trend.description ? <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">{trend.description}</p> : null}
            {oneTime ? null : (
              <form action={updateTrendDescription} className="mt-3 grid gap-2">
                <input type="hidden" name="id" value={trend.id} />
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={trend.description}
                  placeholder="Description for this one"
                  className="rounded-xl border border-black/10 px-3 py-2 text-sm"
                />
                <button className="w-fit rounded-full border border-black/10 px-3 py-1 text-xs font-semibold">Save description</button>
              </form>
            )}
            <a href={trend.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-sm font-semibold text-volt">
              Open on Instagram
            </a>
            <div className="mt-3 flex flex-wrap gap-2">
              {trend.claimedBy ? (
                <p className="text-sm">
                  {oneTime && trend.claimedById === user.id
                    ? "You picked this."
                    : `Accepted by ${trend.claimedBy.firstName} ${trend.claimedBy.lastName}`}
                </p>
              ) : oneTime && picked ? (
                <p className="text-sm">You already picked one.</p>
              ) : (
                <form action={claimTrendLink}>
                  <input type="hidden" name="id" value={trend.id} />
                  <button className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">
                    {oneTime ? "Pick this" : "Accept this"}
                  </button>
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
