import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { workspaceForTeam } from "@/lib/rbac";

export default async function WorkspaceHome() {
  const user = await requireUser();
  const now = new Date();
  const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [tasks, meetings, announcements, messages, notifications] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: user.id,
        status: { not: "COMPLETED" },
      },
      orderBy: { deadline: "asc" },
      take: 6,
    }),
    prisma.meeting.findMany({
      where: {
        startAt: { gte: now },
        OR: [{ attendees: { some: { userId: user.id } } }, { hostId: user.id }],
      },
      orderBy: { startAt: "asc" },
      take: 3,
    }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.message.findMany({
      where: { deletedAt: null },
      include: { author: true, channel: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const dueThisWeek = tasks.filter((t) => t.deadline && t.deadline <= week).length;
  const pending = tasks.filter((t) => t.status === "TODO" || t.status === "NEEDS_REVISION").length;
  const nextMeeting = meetings[0];

  const visibleMessages = messages.filter((m) => {
    if (m.channel.kind === "DM") return false;
    if (user.role === "FOUNDER") return true;
    if (m.channel.kind === "SUBJECT" || m.channel.key === "GENERAL") return true;
    return user.teams.some((t) => t.key === m.channel.key);
  });

  return (
    <div>
      <p className="text-sm text-ink/50">Workspace</p>
      <h1 className="font-display text-4xl">
        {user.mustChangePassword ? `You're in, ${user.firstName}.` : `Welcome back, ${user.firstName}!`}
      </h1>
      {user.mustChangePassword ? (
        <div className="mt-4 rounded-3xl border border-volt/40 bg-volt/20 p-5">
          <p className="font-display text-2xl">Congratulations — you got accepted.</p>
          <p className="mt-2 text-sm text-ink/70">
            This is the team workspace: calendar, messages, tasks, and your role page. Change the
            temporary password in Profile when you have a second.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-full bg-ink px-4 py-2 text-sm text-paper" href="/workspace/calendar">
              Open calendar
            </Link>
            <Link className="rounded-full border border-ink/15 px-4 py-2 text-sm" href="/workspace/messages">
              Messages
            </Link>
            <Link className="rounded-full border border-ink/15 px-4 py-2 text-sm" href="/workspace/tasks">
              Tasks
            </Link>
            <Link className="rounded-full border border-ink/15 px-4 py-2 text-sm" href="/workspace/profile">
              Change password
            </Link>
          </div>
        </div>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat n={`${dueThisWeek} tasks`} l="due this week" />
        <Stat n={`${notifications} unread`} l="notifications" />
        <Stat
          n={nextMeeting ? nextMeeting.title : "No meeting"}
          l={nextMeeting ? formatDateTime(nextMeeting.startAt) : "on the books"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Assigned tasks" href="/workspace/tasks">
          {tasks.length ? (
            tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-black/5 py-3 last:border-0">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-ink/50">{t.status.replace("_", " ")}</p>
                </div>
                {t.deadline ? (
                  <p className="text-xs text-ink/50">{formatDateTime(t.deadline)}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-ink/50">Nothing assigned. Enjoy it while it lasts.</p>
          )}
        </Panel>
        <Panel title="Recent announcements">
          {announcements.map((a) => (
            <div key={a.id} className="border-b border-black/5 py-3 last:border-0">
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-ink/60">{a.body}</p>
            </div>
          ))}
        </Panel>
        <Panel title="Upcoming meetings" href="/workspace/meetings">
          {meetings.length ? (
            meetings.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-ink/50">{formatDateTime(m.startAt)}</p>
                </div>
                <a
                  href={m.meetingLink}
                  className="rounded-full bg-ink px-3 py-1 text-xs text-paper"
                >
                  Join
                </a>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink/50">No upcoming meetings.</p>
          )}
        </Panel>
        <Panel title="Recent team messages" href="/workspace/messages">
          {visibleMessages.slice(0, 5).map((m) => (
            <p key={m.id} className="border-b border-black/5 py-2 text-sm last:border-0">
              <span className="font-medium">{m.author.firstName}</span> in {m.channel.name}:{" "}
              {m.body.slice(0, 80)}
            </p>
          ))}
        </Panel>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-2xl">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="rounded-full bg-ink px-4 py-2 text-sm text-paper" href="/workspace/daily-log">
            Log today
          </Link>
          {user.teams[0] ? (
            <Link
              className="rounded-full border border-ink/10 px-4 py-2 text-sm"
              href={workspaceForTeam(user.teams[0].key)}
            >
              Open my workspace
            </Link>
          ) : null}
          <Link className="rounded-full border border-ink/10 px-4 py-2 text-sm" href="/workspace/tasks">
            {pending} pending
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="font-display text-2xl">{n}</p>
      <p className="text-sm text-ink/50">{l}</p>
    </div>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-xl">{title}</h2>
        {href ? (
          <Link href={href} className="text-xs text-ink/50">
            Open
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
