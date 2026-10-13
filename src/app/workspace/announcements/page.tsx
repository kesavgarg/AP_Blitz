import { prisma } from "@/lib/prisma";
import { isAdmin, requireUser } from "@/lib/auth";
import { listSubjects } from "@/lib/catalog";
import { archiveAnnouncement, publishAnnouncement, updateAnnouncement } from "@/actions/announcements";
import { flushScheduledAnnouncements } from "@/lib/announcements";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WorkspaceAnnouncementsPage() {
  const user = await requireUser();
  await flushScheduledAnnouncements();
  const [rows, subjects] = await Promise.all([
    prisma.announcement.findMany({
      where: { archivedAt: null, audience: { not: "BLITZERS" } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    listSubjects(),
  ]);
  const admin = isAdmin(user);
  return (
    <div className="text-ink">
      <h1 className="font-display text-4xl">Announcements</h1>
      {admin ? (
        <form action={publishAnnouncement} className="mt-6 space-y-3 rounded-3xl bg-white p-4">
          <input name="title" required placeholder="Title" className="w-full rounded-xl border border-black/10 px-3 py-2" />
          <textarea name="body" required placeholder="Message" className="min-h-28 w-full rounded-xl border border-black/10 px-3 py-2" />
          <div className="grid gap-3 md:grid-cols-3">
            <select name="audience" className="rounded-xl border border-black/10 px-3 py-2">
              <option value="TEAM">Team</option>
              <option value="BLITZERS">Blitzers</option>
              <option value="EVERYONE">Everyone</option>
              <option value="SUBJECT">One AP subject</option>
            </select>
            <select name="subjectSlug" className="rounded-xl border border-black/10 px-3 py-2">
              <option value="">Subject, if needed</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.slug}>{subject.name}</option>)}
            </select>
            <input name="scheduledFor" type="datetime-local" className="rounded-xl border border-black/10 px-3 py-2" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" /> Pin</label>
          <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Publish</button>
        </form>
      ) : null}
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl bg-white p-4">
            {admin ? (
              <form action={updateAnnouncement} className="space-y-2">
                <input type="hidden" name="id" value={row.id} />
                <input name="title" defaultValue={row.title} className="w-full rounded-xl border border-black/10 px-3 py-2 font-medium" />
                <textarea name="body" defaultValue={row.body} className="min-h-20 w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
                <button className="text-sm underline">Save edit</button>
              </form>
            ) : (
              <>
                <h2 className="font-display text-2xl">{row.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm">{row.body}</p>
              </>
            )}
            <p className="mt-2 text-xs text-ink/45">{row.audience} · {formatDateTime(row.createdAt)}{row.scheduledFor ? ` · scheduled ${formatDateTime(row.scheduledFor)}` : ""}</p>
            {admin ? (
              <form action={archiveAnnouncement}>
                <input type="hidden" name="id" value={row.id} />
                <button className="text-xs text-ink/50">Archive</button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
