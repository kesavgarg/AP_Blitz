import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireTeam } from "@/lib/auth";
import { addTrendLink, claimTrendLink, completeTrendLink, deleteTrendLink, updateTrendDescription } from "@/actions/trends";
import { isOneTimeMember, isPromotionalMember } from "@/lib/one-time";
import { getOrgSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const user = await requireTeam();
  const [oneTime, promotional, settings] = await Promise.all([
    isOneTimeMember(user.id, user.role),
    isPromotionalMember(user.id, user.role),
    getOrgSettings(),
  ]);
  const phone = settings.contactPhone || "+1 (404) 213-9019";
  const trends = await prisma.trendLink.findMany({
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      claimedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const picked = oneTime ? trends.find((trend) => trend.claimedById === user.id) : null;
  const visible = oneTime
    ? trends.filter((trend) => !trend.claimedById || trend.claimedById === user.id)
    : trends;
  const deadline = oneTime ? new Date(oneTime.acceptedAt.getTime() + 5 * 24 * 60 * 60 * 1000) : null;

  return (
    <div>
      {oneTime ? (
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-volt">Step 2</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Pick the video</h1>
          <p className="mt-3 text-sm">
            You cannot edit this list. Pick one. It leaves the page so nobody else takes it. Then record it.
          </p>
          <p className="mt-2 text-sm text-ink/70">
            You have 5 days{deadline ? `. Send it by ${formatDate(deadline)}` : ""}.
          </p>
          {picked ? (
            <Link href="/workspace/send" className="mt-4 inline-flex rounded-full bg-volt px-5 py-3 text-sm font-semibold text-ink">
              Step 3: send it to Kesav
            </Link>
          ) : null}
        </div>
      ) : promotional ? (
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl text-ink">Trends</h1>
          <p className="mt-3 text-sm text-ink/70">
            See what is here, add your own, then finish them yourself. These do not go into the content pipeline. When a video is done, send it to Kesav at{" "}
            <a className="font-semibold text-volt" href="sms:+14042139019">{phone}</a>.
          </p>
          <Link href="/workspace/promo-guide" className="mt-4 inline-flex text-sm font-semibold text-volt">
            Watch how to record and edit
          </Link>
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
        {visible.length === 0 ? <p className="text-sm text-ink/50">No trends yet.</p> : null}
        {visible.map((trend) => (
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {trend.claimedBy ? (
                <p className="text-sm">
                  {trend.claimedById === user.id
                    ? oneTime
                      ? "You picked this. It is off the list for everyone else."
                      : "You accepted this."
                    : `Accepted by ${trend.claimedBy.firstName} ${trend.claimedBy.lastName}`}
                </p>
              ) : oneTime && picked ? (
                <p className="text-sm">You already picked one.</p>
              ) : (
                <form action={claimTrendLink}>
                  <input type="hidden" name="id" value={trend.id} />
                  <button className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">
                    {oneTime ? "I'll make this" : "Accept this"}
                  </button>
                </form>
              )}
              {!oneTime && trend.claimedById === user.id && !trend.completedAt ? (
                <form action={completeTrendLink}>
                  <input type="hidden" name="id" value={trend.id} />
                  <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold">Mark done</button>
                </form>
              ) : null}
              {trend.completedAt ? (
                <p className="text-sm text-ink/60">{promotional ? `Done. Send the video to ${phone}.` : "Done."}</p>
              ) : null}
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
