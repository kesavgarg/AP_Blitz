import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { markNotificationsRead } from "@/actions/logs";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notes = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Notifications</h1>
        <form action={markNotificationsRead}>
          <button className="text-sm underline">Mark all read</button>
        </form>
      </div>
      <div className="mt-6 space-y-2">
        {notes.map((n) => (
          <Link
            key={n.id}
            href={n.href ?? "/workspace"}
            className={`block rounded-2xl p-4 ${n.readAt ? "bg-white" : "bg-ink text-paper"}`}
          >
            <p className="font-medium">{n.title}</p>
            <p className="text-sm opacity-80">{n.body}</p>
            <p className="mt-1 text-xs opacity-50">{formatDateTime(n.createdAt)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
