import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markAdminAlertsRead } from "@/actions/logs";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  const user = await requireAdmin();
  const notes = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-volt">Admin</p>
          <h1 className="mt-2 font-display text-4xl">Alerts</h1>
        </div>
        <form action={markAdminAlertsRead}>
          <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">Mark all read</button>
        </form>
      </div>
      <p className="mt-3 max-w-2xl text-sm text-paper/60">
        These stay on the admin page. When a video maker accepts a script, the alert shows up here and a direct message is sent to you. The script leaves every other maker&apos;s list.
      </p>
      <div className="mt-6 space-y-2">
        {notes.length === 0 ? <p className="text-sm text-paper/50">No alerts yet.</p> : null}
        {notes.map((note) => (
          <Link
            key={note.id}
            href={note.href ?? "/admin"}
            className={`block rounded-2xl border p-4 ${note.readAt ? "border-white/10 bg-navy" : "border-volt/40 bg-volt/15"}`}
          >
            <p className="font-medium">{note.title}</p>
            <p className="text-sm text-paper/75">{note.body}</p>
            <p className="mt-1 text-xs text-paper/45">{formatDateTime(note.createdAt)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
