import { prisma } from "@/lib/prisma";
import { requireTeam } from "@/lib/auth";
import { sendMessage, markChannelRead } from "@/actions/messages";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessageKesavPage() {
  const user = await requireTeam();
  const founder = await prisma.user.findFirst({
    where: { role: "FOUNDER", isActive: true },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!founder || founder.id === user.id) {
    return <p className="text-sm text-ink/60">Kesav is not available to message right now.</p>;
  }

  const ids = [user.id, founder.id].sort();
  const slug = `dm:${ids.join(":")}`;
  let channel = await prisma.messageChannel.findFirst({ where: { slug } });
  if (!channel) {
    channel = await prisma.messageChannel.create({
      data: {
        slug,
        kind: "DM",
        name: `${founder.firstName} ${founder.lastName}`,
        isPrivate: true,
        members: { create: [{ userId: user.id }, { userId: founder.id }] },
      },
    });
  }

  const messages = await prisma.message.findMany({
    where: { channelId: channel.id, deletedAt: null },
    include: { author: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  await markChannelRead(channel.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl text-ink">Message Kesav</h1>
      <p className="mt-2 text-sm text-ink/60">This only goes to Kesav Garg. Nobody else on the team sees it.</p>
      <div className="mt-6 space-y-3 rounded-3xl bg-white p-4">
        {messages.length === 0 ? <p className="text-sm text-ink/50">No messages yet. Say what you are making.</p> : null}
        {messages.map((message) => (
          <article key={message.id}>
            <p className="text-xs text-ink/40">
              {message.author.firstName} {message.author.lastName} · {formatDateTime(message.createdAt)}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
          </article>
        ))}
      </div>
      <form action={sendMessage} className="mt-4 grid gap-3 rounded-3xl bg-white p-4">
        <input type="hidden" name="channelId" value={channel.id} />
        <textarea name="body" required rows={4} placeholder="Message Kesav" className="rounded-xl border border-black/10 px-3 py-2" />
        <button className="w-fit rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">Send</button>
      </form>
    </div>
  );
}
