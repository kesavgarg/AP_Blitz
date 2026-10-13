import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { markNotificationsRead } from "@/actions/logs";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { PushSettings } from "@/components/notifications/push-settings";
import { PreferenceForm } from "@/components/notifications/preference-form";
import { pushConfigured, vapidPublicKey } from "@/lib/push";

export default async function NotificationsPage() {
  const user = await requireUser();
  const [notes, pref, subs] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notificationPreference.findUnique({ where: { userId: user.id } }),
    prisma.pushSubscription.count({ where: { userId: user.id } }),
  ]);
  const values = {
    newVideos: pref?.newVideos ?? true,
    subjectVideos: pref?.subjectVideos ?? true,
    announcements: pref?.announcements ?? true,
    requestUpdates: pref?.requestUpdates ?? true,
    teamMessages: pref?.teamMessages ?? true,
    deadlines: pref?.deadlines ?? true,
    meetings: pref?.meetings ?? true,
  };
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
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <PushSettings configured={pushConfigured()} publicKey={vapidPublicKey()} subscribed={subs > 0} />
        <PreferenceForm values={values} audience="team" />
      </div>
    </div>
  );
}
