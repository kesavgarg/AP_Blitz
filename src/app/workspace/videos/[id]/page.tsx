import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireUser } from "@/lib/auth";
import { listSubjects } from "@/lib/catalog";
import {
  addChapterAction,
  deleteChapterAction,
  moveChapterAction,
  saveLibraryVideo,
  unpublishLibraryVideo,
  updateChapterAction,
} from "@/actions/library";
import { formatTimestamp } from "@/lib/videos";
import { formatDateTime } from "@/lib/utils";
import { WatchPlayer } from "@/components/public/watch-player";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  if (user.role === "BLITZER") redirect("/student/dashboard");
  const { id } = await params;
  const { error, saved } = await searchParams;
  const video = await prisma.libraryVideo.findUnique({
    where: { id },
    include: {
      subject: true,
      chapters: { orderBy: [{ sortOrder: "asc" }, { seconds: "asc" }] },
      events: { orderBy: { createdAt: "desc" }, take: 12, include: { user: true } },
    },
  });
  if (!video) notFound();
  const [subjects, people] = await Promise.all([
    listSubjects(),
    prisma.user.findMany({ where: { isActive: true, role: { not: "BLITZER" } }, orderBy: { firstName: "asc" } }),
  ]);
  const admin = isAdmin(user);

  return (
    <div className="text-ink">
      <h1 className="font-display text-4xl">{video.title}</h1>
      <p className="mt-1 text-sm text-ink/50">{video.status === "PUBLISHED" ? "Published" : "Draft — hidden from the public library"}</p>
      {error ? <p className="mt-4 rounded-2xl bg-coral/15 px-4 py-3 text-sm text-coral">{error}</p> : null}
      {saved ? <p className="mt-4 rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">Saved.</p> : null}
      <form action={saveLibraryVideo} className="mt-6 grid gap-3 rounded-3xl bg-white p-4 md:grid-cols-2">
        <input type="hidden" name="id" value={video.id} />
        <label className="text-sm">Title
          <input name="title" defaultValue={video.title} required className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" />
        </label>
        <label className="text-sm">Video URL
          <input name="url" defaultValue={video.url} required className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" />
        </label>
        <label className="text-sm">AP subject
          <select name="subjectId" defaultValue={video.subjectId} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2">
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Unit or topic
          <input name="unit" defaultValue={video.unit || ""} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" />
        </label>
        <label className="text-sm md:col-span-2">Description
          <textarea name="description" defaultValue={video.description} className="mt-1 min-h-24 w-full rounded-xl border border-black/10 px-3 py-2" />
        </label>
        <label className="text-sm">Thumbnail URL
          <input name="thumbnailUrl" defaultValue={video.thumbnailUrl || ""} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" />
        </label>
        <label className="text-sm">Duration (m:ss)
          <input name="duration" defaultValue={video.durationSeconds ? formatTimestamp(video.durationSeconds) : ""} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" />
        </label>
        <label className="text-sm">Tags
          <input name="tags" defaultValue={video.tags || ""} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" />
        </label>
        <label className="text-sm">Owner
          <select name="ownerId" defaultValue={video.ownerId || ""} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2">
            <option value="">Unassigned</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
          </select>
        </label>
        <label className="text-sm">Deadline
          <input name="deadline" type="date" defaultValue={video.deadline ? video.deadline.toISOString().slice(0, 10) : ""} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="forceDuplicate" />
          Keep a separate record if this URL already exists
        </label>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button name="intent" value="save" className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold">Save</button>
          {admin ? <button name="intent" value="publish" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Publish</button> : null}
        </div>
      </form>
      {admin && video.status === "PUBLISHED" ? (
        <form action={unpublishLibraryVideo} className="mt-3">
          <input type="hidden" name="id" value={video.id} />
          <button className="text-sm underline">Unpublish</button>
        </form>
      ) : null}

      <section className="mt-8 rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Timestamps</h2>
        <p className="mt-1 text-sm text-ink/60">Use 0:25 or 1:03:10. YouTube can jump to these. Instagram cannot.</p>
        <div className="mt-4 space-y-2">
          {video.chapters.map((chapter) => (
            <div key={chapter.id} className="flex flex-wrap items-center gap-2">
              <form action={updateChapterAction} className="flex flex-1 flex-wrap gap-2">
                <input type="hidden" name="id" value={chapter.id} />
                <input name="time" defaultValue={formatTimestamp(chapter.seconds)} className="w-24 rounded-xl border border-black/10 px-2 py-2 font-mono text-sm" />
                <input name="label" defaultValue={chapter.label} className="min-w-40 flex-1 rounded-xl border border-black/10 px-2 py-2 text-sm" />
                <button className="rounded-full bg-black/5 px-3 py-2 text-xs">Save</button>
              </form>
              <form action={moveChapterAction}>
                <input type="hidden" name="id" value={chapter.id} />
                <input type="hidden" name="direction" value="up" />
                <button className="rounded-full border border-black/10 px-2 py-1 text-xs">Up</button>
              </form>
              <form action={moveChapterAction}>
                <input type="hidden" name="id" value={chapter.id} />
                <input type="hidden" name="direction" value="down" />
                <button className="rounded-full border border-black/10 px-2 py-1 text-xs">Down</button>
              </form>
              <form action={deleteChapterAction}>
                <input type="hidden" name="id" value={chapter.id} />
                <button className="text-xs text-red-700">Delete</button>
              </form>
            </div>
          ))}
        </div>
        <form action={addChapterAction} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="videoId" value={video.id} />
          <input name="time" placeholder="0:25" required className="w-24 rounded-xl border border-black/10 px-2 py-2 font-mono text-sm" />
          <input name="label" placeholder="Key concept" required className="min-w-40 flex-1 rounded-xl border border-black/10 px-2 py-2 text-sm" />
          <button className="rounded-full bg-ink px-3 py-2 text-sm text-paper">Add</button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Preview</h2>
        <div className="mt-3 rounded-3xl bg-[#120f0c] p-4 text-paper">
          <WatchPlayer videoId={video.id} title={video.title} url={video.url} platform={video.platform} chapters={video.chapters} canSaveProgress={false} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">History</h2>
        <ul className="mt-3 space-y-1 text-sm text-ink/60">
          {video.events.map((event) => (
            <li key={event.id}>{formatDateTime(event.createdAt)} · {event.user?.firstName || "Someone"} · {event.action}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
