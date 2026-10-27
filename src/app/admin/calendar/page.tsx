import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEvent, deleteEvent } from "@/actions/calendar";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  await requireAdmin();
  const { created, error } = await searchParams;
  const [events, teams] = await Promise.all([
    prisma.calendarEvent.findMany({
      include: { team: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.team.findMany({ where: { key: { not: "SEO" } }, orderBy: { name: "asc" } }),
  ]);
  const now = new Date();
  const upcoming = events.filter((e) => e.startAt >= now);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form action={createEvent} className="rounded-3xl border border-white/10 bg-navy p-6">
        <h1 className="font-display text-4xl">Team calendar</h1>
        <p className="mt-2 text-sm text-paper/60">
          Leave audience on <strong>Everyone</strong> so every accepted member sees it in
          Workspace → Calendar.
        </p>
        {created ? (
          <p className="mt-3 rounded-xl bg-volt/15 px-3 py-2 text-sm text-volt">
            Event saved. Members will see it on their calendar and get an in-app alert.
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-xl bg-coral/20 px-3 py-2 text-sm text-coral">{error}</p>
        ) : null}
        <input type="hidden" name="next" value="/admin/calendar" />
        <div className="mt-5 space-y-3 text-sm">
          <input name="title" required placeholder="Title" className="w-full rounded-xl bg-ink px-3 py-2" />
          <textarea
            name="description"
            placeholder="Details (optional)"
            className="w-full rounded-xl bg-ink px-3 py-2"
          />
          <label className="block text-paper/60">
            Starts
            <input name="startAt" type="datetime-local" required className="mt-1 w-full rounded-xl bg-ink px-3 py-2 text-paper" />
          </label>
          <select name="type" className="w-full rounded-xl bg-ink px-3 py-2">
            <option value="TEAM_EVENT">Team event</option>
            <option value="MEETING">Meeting</option>
            <option value="TASK_DEADLINE">Task deadline</option>
            <option value="CONTENT_DEADLINE">Content deadline</option>
            <option value="POSTING_DATE">Posting date</option>
            <option value="ANNOUNCEMENT">Announcement</option>
          </select>
          <select name="teamKey" defaultValue="" className="w-full rounded-xl bg-ink px-3 py-2">
            <option value="">Everyone on AP Blitz</option>
            {teams.map((t) => (
              <option key={t.id} value={t.key}>
                Only {t.name}
              </option>
            ))}
          </select>
          <SubmitButton pendingLabel="Adding…" className="rounded-full bg-volt px-5 py-2 font-semibold text-ink">
            Add to calendar
          </SubmitButton>
        </div>
      </form>
      <section className="rounded-3xl border border-white/10 bg-navy p-6">
        <h2 className="font-display text-2xl">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-paper/50">No upcoming events yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {upcoming.map((e) => (
              <article key={e.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-paper/50">
                    {formatDateTime(e.startAt)} · {e.team?.name ?? "Everyone"}
                  </p>
                  {e.description ? <p className="mt-1 text-sm text-paper/70">{e.description}</p> : null}
                </div>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-xs text-coral">Delete</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
