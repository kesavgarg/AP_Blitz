import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChannel } from "@/lib/rbac";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MessagesIndex() {
  const user = await requireUser();
  const channels = await prisma.messageChannel.findMany();
  const general = channels.find((c) => c.key === "GENERAL" && canAccessChannel(user, c.key));
  const first = general ?? channels.find((c) => canAccessChannel(user, c.key));
  if (first) redirect(`/workspace/messages/${first.id}`);
  return (
    <div>
      <h1 className="font-display text-4xl">Messages</h1>
      <p className="mt-2 text-ink/60">No channels yet.</p>
    </div>
  );
}
