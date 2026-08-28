import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canAccessChannel, canModerateChannel, channelAudience, sortChannels } from "@/lib/rbac";
import { deleteMessage, pinMessage, sendMessage, markChannelRead } from "@/actions/messages";
import { formatDateTime } from "@/lib/utils";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const user = await requireUser();
  const { channelId } = await params;
  const channel = await prisma.messageChannel.findUnique({ where: { id: channelId } });
  if (!channel || !canAccessChannel(user, channel.key)) notFound();

  const [channels, messages] = await Promise.all([
    prisma.messageChannel.findMany({ orderBy: { name: "asc" } }),
    prisma.message.findMany({
      where: { channelId },
      include: { author: true, file: true, pins: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
  ]);
  await markChannelRead(channelId, user.id);
  const visible = sortChannels(channels.filter((c) => canAccessChannel(user, c.key)));
  const canMod = canModerateChannel(user, channel.key);

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-3xl bg-white p-3 shadow-sm">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">
          Channels
        </p>
        {visible.map((c) => (
          <Link
            key={c.id}
            href={`/workspace/messages/${c.id}`}
            className={`block rounded-xl px-3 py-2 text-sm ${c.id === channel.id ? "bg-ink text-paper" : "hover:bg-black/5"}`}
          >
            # {c.key === "GENERAL" ? "General (everyone)" : c.name}
          </Link>
        ))}
      </aside>
      <section className="flex min-h-[70vh] flex-col rounded-3xl bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h1 className="font-display text-2xl"># {channel.name}</h1>
          <p className="text-xs text-ink/50">{channelAudience(channel.key)}</p>
          {channel.key === "ADMIN" ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Members cannot see this channel. To message the whole team, use # General or Admin →
              Messages.
            </p>
          ) : null}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => (
            <article key={m.id} className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs text-volt">
                {m.author.firstName[0]}
                {m.author.lastName[0]}
              </div>
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
            placeholder="Message the team…"
            className="w-full rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <input type="file" name="file" className="text-xs" />
            <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">Send</button>
          </div>
        </form>
      </section>
    </div>
  );
}
