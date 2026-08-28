import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { submitDailyLog } from "@/actions/logs";
import { formatDate } from "@/lib/utils";

export default async function DailyLogPage() {
  const user = await requireUser();
  const logs = await prisma.dailyLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 14,
  });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl">Daily Log</h1>
        <p className="mt-2 text-ink/60">
          Quick activity report. Admins can see these. You don&apos;t need to write a novel.
        </p>
        <form action={submitDailyLog} className="mt-6 space-y-3 rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-ink/50">
            {user.firstName} {user.lastName} · {formatDate(new Date())}
          </p>
          <label className="block text-sm">
            What did you do today? *
            <textarea
              name="whatDid"
              required
              rows={6}
              placeholder='Reviewed assignments, finished a script, edited two reels…'
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Hours / time worked (optional)
            <input name="hours" type="number" step="0.25" className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          <label className="block text-sm">
            Additional notes
            <textarea name="notes" rows={3} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          <button className="rounded-full bg-ink px-4 py-2 text-paper">Publish log</button>
        </form>
      </div>
      <div>
        <h2 className="font-display text-2xl">Your recent logs</h2>
        <div className="mt-4 space-y-3">
          {logs.map((log) => (
            <article key={log.id} className="rounded-3xl bg-white p-4 shadow-sm">
              <p className="text-xs text-ink/40">{formatDate(log.date)}</p>
              <p className="mt-1 text-sm">{log.whatDid}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
