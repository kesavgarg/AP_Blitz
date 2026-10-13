import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markNotificationsRead } from "@/actions/logs";
import { formatDateTime } from "@/lib/utils";
import { PushSettings } from "@/components/notifications/push-settings";
import { PreferenceForm } from "@/components/notifications/preference-form";
import { pushConfigured, vapidPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

export default async function StudentNotificationsPage() {
  const user = await requireUser();
  const [notes, pref, subs] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 40 }),
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
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl">Notifications</h1>
          <form action={markNotificationsRead}><button className="text-sm underline">Mark all read</button></form>
        </div>
        <div className="mt-4 space-y-2">
          {notes.map((note) => (
            <Link key={note.id} href={note.href || "/student/dashboard"} className={`block rounded-2xl p-4 ${note.readAt ? "bg-white/5" : "bg-volt text-ink"}`}>
              <p className="font-medium">{note.title}</p>
              <p className="text-sm opacity-80">{note.body}</p>
              <p className="mt-1 text-xs opacity-60">{formatDateTime(note.createdAt)}</p>
            </Link>
          ))}
          {notes.length === 0 ? <p className="text-sm text-paper/50">No notifications yet.</p> : null}
        </div>
      </div>
      <div className="space-y-4">
        <PushSettings configured={pushConfigured()} publicKey={vapidPublicKey()} subscribed={subs > 0} />
        <PreferenceForm values={values} audience="student" />
      </div>
    </div>
  );
}
