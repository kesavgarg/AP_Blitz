import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createMeeting } from "@/actions/meetings";
import { formatDateTime } from "@/lib/utils";

export default async function MeetingsPage() {
  const user = await requireUser();
  const meetings = await prisma.meeting.findMany({
    where:
      user.role === "FOUNDER"
        ? undefined
        : {
            OR: [{ hostId: user.id }, { attendees: { some: { userId: user.id } } }],
          },
    include: { attendees: { include: { user: true } }, host: true },
    orderBy: { startAt: "asc" },
  });
  const members = await prisma.user.findMany({ where: { isActive: true }, orderBy: { firstName: "asc" } });
  const now = Date.now();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        <h1 className="font-display text-4xl">Meetings</h1>
        <div className="mt-6 space-y-4">
          {meetings.map((m) => {
            const start = m.startAt.getTime();
            const end = m.endAt?.getTime() ?? start + 60 * 60 * 1000;
            const active = now >= start - 15 * 60 * 1000 && now <= end + 15 * 60 * 1000;
            return (
              <article key={m.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl">{m.title}</h2>
                    <p className="text-sm text-ink/50">{formatDateTime(m.startAt)}</p>
                    <p className="mt-2 text-sm">{m.description}</p>
                    <p className="mt-2 text-xs text-ink/40">
                      Host: {m.host.firstName} ·{" "}
                      {m.attendees.map((a) => a.user.firstName).join(", ")}
                    </p>
                  </div>
                  {active || start > now ? (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-volt"
                    >
                      Join Meeting
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {user.role !== "MEMBER" ? (
        <form action={createMeeting} className="h-fit rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl">Schedule</h2>
          <div className="mt-4 space-y-3 text-sm">
            <input name="title" required placeholder="Title" className="w-full rounded-xl border px-3 py-2" />
            <textarea name="description" placeholder="What is this for?" className="w-full rounded-xl border px-3 py-2" />
            <input name="startAt" type="datetime-local" required className="w-full rounded-xl border px-3 py-2" />
            <input
              name="meetingLink"
              required
              placeholder="Google Meet or Zoom link"
              className="w-full rounded-xl border px-3 py-2"
            />
            <label className="block">
              Required attendees (hold cmd/ctrl to multi-select)
              <select name="attendeeIds" multiple className="mt-1 h-32 w-full rounded-xl border px-3 py-2">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </label>
            <button className="rounded-full bg-ink px-4 py-2 text-paper">Create meeting</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
