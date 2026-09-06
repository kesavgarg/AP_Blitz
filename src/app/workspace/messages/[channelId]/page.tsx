import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFounder, requireUser } from "@/lib/auth";
import { canAccessChannel, canModerateChannel, channelAudience, sortChannels } from "@/lib/rbac";
import { createSubjectChannel, deleteMessage, openDirectMessage, pinMessage, sendMessage, markChannelRead } from "@/actions/messages";
import { formatDateTime } from "@/lib/utils";
import { AP_SUBJECTS } from "@/lib/ap-subjects";
import { SubmitButton } from "@/components/ui/submit-button";
import { Avatar } from "@/components/workspace/avatar";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const user = await requireUser();
  const { channelId } = await params;
  const channel = await prisma.messageChannel.findUnique({
    where: { id: channelId },
    include: { members: { include: { user: true } } },
  });
  if (!channel || !canAccessChannel(user, channel)) notFound();

  const [channels, messages, people] = await Promise.all([
    prisma.messageChannel.findMany({
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.message.findMany({
      where: { channelId },
      include: { author: true, file: true, pins: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { isActive: true, id: { not: user.id } },
      orderBy: { firstName: "asc" },
    }),
  ]);
  await markChannelRead(channelId, user.id);
  const visible = sortChannels(channels.filter((c) => canAccessChannel(user, c)));
  const unreadRows = await prisma.message.groupBy({
    by: ["channelId"],
    where: {
      channelId: { in: visible.map((c) => c.id) },
      deletedAt: null,
      authorId: { not: user.id },
      reads: { none: { userId: user.id } },
    },
    _count: true,
  });
  const unread = Object.fromEntries(unreadRows.map((r) => [r.channelId, r._count]));
  const canMod = canModerateChannel(user, channel);
  const teams = visible.filter((c) => (c.kind ?? "TEAM") === "TEAM");
  const subjects = visible.filter((c) => c.kind === "SUBJECT");
  const dms = visible.filter((c) => c.kind === "DM");
  const dmLabel = (c: (typeof visible)[0]) => {
    const other = c.members.find((m) => m.userId !== user.id)?.user;
    return other ? `${other.firstName} ${other.lastName}` : "Direct message";
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-3 rounded-3xl bg-white p-3 shadow-sm">
        <ChannelGroup title="Channels">
          {teams.map((c) => (
            <ChannelLink
              key={c.id}
              id={c.id}
              active={c.id === channel.id}
              unread={unread[c.id] ?? 0}
              label={`# ${c.key === "GENERAL" ? "General (everyone)" : c.name}`}
            />
          ))}
        </ChannelGroup>
        <ChannelGroup title="AP subjects">
          {subjects.map((c) => (
            <ChannelLink
              key={c.id}
              id={c.id}
              active={c.id === channel.id}
              unread={unread[c.id] ?? 0}
              label={`# ${c.name}`}
            />
          ))}
          {isFounder(user) || user.role === "TEAM_ADMIN" ? (
            <form action={createSubjectChannel} className="space-y-1 px-1 pt-1">
              <select name="apSubject" required className="w-full rounded-lg border px-2 py-1 text-xs">
                <option value="">New AP subject chat</option>
                {AP_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <SubmitButton className="w-full rounded-lg bg-ink py-1 text-[11px] text-paper" pendingLabel="Opening…">
                Create GC
              </SubmitButton>
            </form>
          ) : null}
        </ChannelGroup>
        <ChannelGroup title="Direct messages">
          {dms.map((c) => (
            <ChannelLink
              key={c.id}
              id={c.id}
              active={c.id === channel.id}
              unread={unread[c.id] ?? 0}
              label={dmLabel(c)}
            />
          ))}
          <form action={openDirectMessage} className="space-y-1 px-1 pt-1">
            <select name="userId" required className="w-full rounded-lg border px-2 py-1 text-xs">
              <option value="">Message someone</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            <SubmitButton className="w-full rounded-lg border py-1 text-[11px]" pendingLabel="Opening…">
              Open DM
            </SubmitButton>
          </form>
        </ChannelGroup>
      </aside>
      <section className="flex min-h-[70vh] flex-col rounded-3xl bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h1 className="font-display text-2xl">
            {channel.kind === "DM" ? dmLabel(channel) : `# ${channel.name}`}
          </h1>
          <p className="text-xs text-ink/50">{channelAudience(channel)}</p>
          {channel.key === "ADMIN" ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Members cannot see this channel. To message the whole team, use # General.
            </p>
          ) : null}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => (
            <article key={m.id} className="flex gap-3">
              <Avatar user={m.author} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">
                    {m.author.firstName} {m.author.lastName}
                  </span>{" "}
                  <span className="text-xs text-ink/40">{formatDateTime(m.createdAt)}</span>
                  {m.pins.length ? <span className="ml-2 text-xs text-amber-600">pinned</span> : null}
                </p>
                <p className="whitespace-pre-wrap text-sm text-ink/80">{m.body}</p>
                {m.file ? (
                  <a className="text-xs text-ink underline" href={`/api/files/${m.file.id}`}>
                    {m.file.filename}
                  </a>
                ) : null}
                <div className="mt-1 flex gap-3 text-xs text-ink/40">
                  {canMod ? (
                    <form action={pinMessage}>
                      <input type="hidden" name="messageId" value={m.id} />
                      <button>Pin</button>
                    </form>
                  ) : null}
                  {canMod || m.authorId === user.id ? (
                    <form action={deleteMessage}>
                      <input type="hidden" name="messageId" value={m.id} />
                      <button>Remove</button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
        <form action={sendMessage} className="border-t border-black/5 p-4">
          <input type="hidden" name="channelId" value={channel.id} />
          <textarea
            name="body"
            rows={3}
            placeholder={channel.kind === "DM" ? "Write a private message…" : "Message the team…"}
            className="w-full rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <input type="file" name="file" className="text-xs" />
            <SubmitButton className="rounded-full bg-ink px-4 py-2 text-sm text-paper" pendingLabel="Sending…">
              Send
            </SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}

function ChannelGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink/40">{title}</p>
      {children}
    </div>
  );
}

function ChannelLink({
  id,
  label,
  active,
  unread,
}: {
  id: string;
  label: string;
  active: boolean;
  unread: number;
}) {
  return (
    <Link
      href={`/workspace/messages/${id}`}
      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${active ? "bg-ink text-paper" : "hover:bg-black/5"}`}
    >
      <span className="truncate">{label}</span>
      {unread > 0 ? (
        <span className="ml-2 grid min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
