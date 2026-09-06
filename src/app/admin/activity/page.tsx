import { prisma } from "@/lib/prisma";
import { requireFounder } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string; team?: string; date?: string }>;
}) {
  await requireFounder();
  const { person, team, date } = await searchParams;
  const [logs, daily, users, teams] = await Promise.all([
    prisma.activityLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.dailyLog.findMany({
      where: {
        userId: person || undefined,
        teamId: team || undefined,
        date: date ? new Date(date) : undefined,
      },
      include: { user: true, team: true },
      orderBy: { date: "desc" },
      take: 40,
    }),
    prisma.user.findMany({ orderBy: { firstName: "asc" } }),
    prisma.team.findMany({ where: { key: { not: "SEO" } } }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h1 className="font-display text-4xl">Audit log</h1>
        <div className="mt-4 space-y-2">
          {logs.map((l) => (
            <p key={l.id} className="rounded-2xl border border-white/10 bg-navy px-4 py-3 text-sm">
              {l.action}
              <span className="ml-2 text-xs text-paper/40">{formatDateTime(l.createdAt)}</span>
            </p>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-3xl">Daily logs</h2>
        <form className="mt-4 flex flex-wrap gap-2 text-sm">
          <select name="person" defaultValue={person} className="rounded-xl bg-navy px-3 py-2">
            <option value="">Anyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
          <select name="team" defaultValue={team} className="rounded-xl bg-navy px-3 py-2">
            <option value="">Any team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input name="date" type="date" defaultValue={date} className="rounded-xl bg-navy px-3 py-2" />
          <button className="rounded-full bg-volt px-3 py-1 font-semibold text-ink">Filter</button>
        </form>
        <div className="mt-4 space-y-3">
          {daily.map((d) => (
            <article key={d.id} className="rounded-2xl border border-white/10 bg-navy p-4">
              <p className="text-xs text-paper/40">
                {d.user.firstName} {d.user.lastName} · {d.team?.name} · {d.date.toDateString()}
              </p>
              <p className="mt-1 text-sm">{d.whatDid}</p>
              {d.hours ? <p className="text-xs text-paper/50">{d.hours} hrs</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
