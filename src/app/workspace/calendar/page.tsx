import { prisma } from "@/lib/prisma";
import { isFounder, onTeam, requireUser } from "@/lib/auth";
import { createEvent, deleteEvent } from "@/actions/calendar";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDateTime } from "@/lib/utils";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
} from "date-fns";
import { dayKey, monthCursor, monthKey } from "@/lib/calendar-dates";

export const dynamic = "force-dynamic";

const COLORS: Record<string, string> = {
  TASK_DEADLINE: "bg-coral/20 text-coral",
  CONTENT_DEADLINE: "bg-cyan/20 text-[#0e7490]",
  MEETING: "bg-violet/20 text-violet",
  POSTING_DATE: "bg-volt/40 text-ink",
  TEAM_EVENT: "bg-ink/10",
  ANNOUNCEMENT: "bg-amber-100",
  APPLICATION: "bg-emerald-100",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; created?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { month, created, error } = await searchParams;
  const cursor = monthCursor(month);
  const start = startOfWeek(cursor);
  const end = endOfWeek(endOfMonth(cursor));
  const days = eachDayOfInterval({ start, end });
  const now = new Date();

  const [events, upcomingEvents] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { startAt: { gte: start, lte: end } },
      include: { team: true, assignees: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.calendarEvent.findMany({
      where: { startAt: { gte: now } },
      include: { team: true, assignees: true },
      orderBy: { startAt: "asc" },
      take: 24,
    }),
  ]);
  const teams = (await prisma.team.findMany({ orderBy: { name: "asc" } })).filter(
    (t) => t.key !== "SEO",
  );

  const prev = monthKey(addMonths(cursor, -1));
  const next = monthKey(addMonths(cursor, 1));
  const monthQuery = monthKey(cursor);
  const canSee = (e: (typeof events)[number]) => {
    if (isFounder(user)) return true;
    if (!e.team) return true;
    if (onTeam(user, e.team.key)) return true;
    if (e.assignees.some((a) => a.userId === user.id)) return true;
    return false;
  };
  const visible = events.filter(canSee);
  const upcoming = upcomingEvents.filter(canSee);

  return (
    <div>
      {created ? (
        <p className="mb-4 rounded-2xl bg-volt px-4 py-3 text-sm font-medium text-[#1a1208]">
          Event added. It is on this month, and the people you picked can see it.
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-2xl border border-coral/40 bg-coral/15 px-4 py-3 text-sm text-[#f6f1e8]">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Calendar</h1>
          <p className="text-ink/50">{format(cursor, "MMMM yyyy")}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <a className="rounded-full border px-3 py-1" href={`/workspace/calendar?month=${prev}`}>
            Prev
          </a>
          <a className="rounded-full border px-3 py-1" href={`/workspace/calendar?month=${next}`}>
            Next
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {user.role !== "MEMBER" ? (
          <form action={createEvent} className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl">New event</h2>
            <p className="mt-1 text-sm text-ink/50">
              Default is everyone on the team. Members see this on their calendar.
            </p>
            <input type="hidden" name="next" value="/workspace/calendar" />
            <div className="mt-4 space-y-3 text-sm">
              <input name="title" required placeholder="Title" className="w-full rounded-xl border px-3 py-2" />
              <textarea name="description" placeholder="Description" className="w-full rounded-xl border px-3 py-2" />
              <input name="startAt" type="datetime-local" required className="w-full rounded-xl border px-3 py-2" />
              <select name="type" className="w-full rounded-xl border px-3 py-2">
                <option value="TEAM_EVENT">Team event</option>
                <option value="MEETING">Meeting</option>
                <option value="TASK_DEADLINE">Task deadline</option>
                <option value="CONTENT_DEADLINE">Content deadline</option>
                <option value="POSTING_DATE">Posting date</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>
              <select name="teamKey" defaultValue="" className="w-full rounded-xl border px-3 py-2">
                <option value="">Everyone on AP Blitz</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.key}>
                    Only {t.name}
                  </option>
                ))}
              </select>
              <SubmitButton pendingLabel="Adding…" className="rounded-full bg-ink px-4 py-2 text-paper">
                Create
              </SubmitButton>
            </div>
          </form>
        ) : null}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl">Upcoming</h2>
          {upcoming.length ? (
            upcoming.slice(0, 12).map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 border-b border-black/5 py-3 last:border-0">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-ink/50">
                    {formatDateTime(e.startAt)} · {e.team?.name ?? "Everyone"}
                  </p>
                  {e.description ? <p className="text-sm text-ink/60">{e.description}</p> : null}
                </div>
                {user.role !== "MEMBER" ? (
                  <form action={deleteEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="next" value={`/workspace/calendar?month=${monthQuery}`} />
                    <button className="text-xs text-ink/40">Delete</button>
                  </form>
                ) : null}
              </div>
            ))
          ) : (
            <p className="mt-3 text-sm text-ink/50">Nothing coming up. Add an event and it will show on the day you picked.</p>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl bg-white p-4 shadow-sm">
        <div className="grid min-w-[720px] grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <p key={d} className="px-2 text-xs font-semibold uppercase text-ink/40">
              {d}
            </p>
          ))}
          {days.map((day) => {
            const key = dayKey(day);
            const dayEvents = visible.filter((e) => dayKey(e.startAt) === key);
            return (
              <div
                key={key}
                className={`cal-day min-h-24 rounded-xl p-2 ${isSameMonth(day, cursor) ? "" : "cal-day-out"}`}
              >
                <p className="cal-num text-sm font-semibold">{format(day, "d")}</p>
                {dayEvents.map((e) => (
                  <p
                    key={e.id}
                    className={`mt-1 truncate rounded-md px-1 text-[10px] ${COLORS[e.type] ?? "bg-black/5"}`}
                    title={e.title}
                  >
                    {e.title}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
