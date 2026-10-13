import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { listSubjects } from "@/lib/catalog";
import { saveLibraryVideo } from "@/actions/library";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspaceVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; published?: string }>;
}) {
  const { error, saved, published } = await searchParams;
  const user = await requireUser();
  if (user.role === "BLITZER") redirect("/student/dashboard");
  const [videos, publishedVideos, subjects, people] = await Promise.all([
    prisma.libraryVideo.findMany({
      where: { status: { not: "PUBLISHED" } },
      include: { subject: true, owner: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.libraryVideo.findMany({
      where: { status: "PUBLISHED" },
      include: { subject: true },
      orderBy: { publishedAt: "desc" },
    }),
    listSubjects(),
    prisma.user.findMany({
      where: { isActive: true, role: { not: "BLITZER" } },
      orderBy: { firstName: "asc" },
    }),
  ]);
  return (
    <div>
      <h1 className="font-display text-4xl text-ink">Videos</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/60">
        Add a URL once. Publishing puts that same record in the public library, under the subject you picked. Drafts stay private.
      </p>
      {error ? <p className="mt-4 rounded-2xl bg-coral/15 px-4 py-3 text-sm text-coral">{error}</p> : null}
      {saved ? <p className="mt-4 rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">Saved.</p> : null}
      {published ? <p className="mt-4 rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">Published. It’s in the public library. Add another video here.</p> : null}
      <form action={saveLibraryVideo} className="mt-6 grid gap-3 rounded-3xl bg-white p-4 md:grid-cols-2">
        <input name="title" required placeholder="Title" className="rounded-xl border border-black/10 px-3 py-2" />
        <input name="url" required placeholder="YouTube or Instagram URL" className="rounded-xl border border-black/10 px-3 py-2" />
        <select name="subjectId" required className="rounded-xl border border-black/10 px-3 py-2">
          <option value="">AP subject</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
        <input name="unit" placeholder="Unit or topic" className="rounded-xl border border-black/10 px-3 py-2" />
        <textarea name="description" placeholder="Description" className="rounded-xl border border-black/10 px-3 py-2 md:col-span-2" />
        <select name="ownerId" className="rounded-xl border border-black/10 px-3 py-2">
          <option value="">Owner</option>
          {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
        </select>
        <input name="deadline" type="date" className="rounded-xl border border-black/10 px-3 py-2" />
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button name="intent" value="save" className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-ink">Save draft</button>
          {user.role === "FOUNDER" || user.role === "TEAM_ADMIN" ? (
            <button name="intent" value="publish" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Publish</button>
          ) : null}
        </div>
      </form>
      <div className="mt-6 space-y-2">
        {videos.map((video) => (
          <Link key={video.id} href={`/workspace/videos/${video.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
            <span>
              <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: video.subject.color }} />
              <span className="font-medium text-ink">{video.title}</span>
              <span className="ml-2 text-xs text-ink/50">{video.subject.shortName} · {video.status}</span>
            </span>
            <span className="text-xs text-ink/40">{video.owner?.firstName || "Unassigned"}</span>
          </Link>
        ))}
        {videos.length === 0 ? <p className="text-sm text-ink/50">No drafts waiting. Add the next one above.</p> : null}
      </div>
      {publishedVideos.length ? (
        <div className="mt-8">
          <h2 className="font-display text-2xl text-ink">Published</h2>
          <div className="mt-3 space-y-2">
            {publishedVideos.map((video) => (
              <Link key={video.id} href={`/workspace/videos/${video.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <span>
                  <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: video.subject.color }} />
                  <span className="font-medium text-ink">{video.title}</span>
                  <span className="ml-2 text-xs text-ink/50">{video.subject.shortName}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
