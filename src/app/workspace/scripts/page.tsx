import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFounder, leadsTeam, onTeam, requireUser } from "@/lib/auth";
import { reviewScript, saveScript } from "@/actions/content";

export default async function ScriptsWorkspace({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await requireUser();
  if (!onTeam(user, "SCRIPT_WRITER") && !isFounder(user)) notFound();
  const { id } = await searchParams;
  const scripts = await prisma.script.findMany({
    where: isFounder(user) || leadsTeam(user, "SCRIPT_WRITER") ? undefined : { authorId: user.id },
    include: { contentItem: true, author: true },
    orderBy: { updatedAt: "desc" },
  });
  const active = scripts.find((s) => s.id === id) ?? scripts[0];
  const creators = await prisma.user.findMany({
    where: { memberships: { some: { team: { key: "VIDEO_CREATOR" } } } },
  });
  const canReview = isFounder(user) || leadsTeam(user, "SCRIPT_WRITER");

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-3xl bg-white p-3 shadow-sm">
        <h1 className="px-2 font-display text-xl">Scripts</h1>
        <form action={saveScript} className="mt-3 px-2">
          <input type="hidden" name="title" value="Untitled script" />
          <input type="hidden" name="body" value="" />
          <button className="w-full rounded-xl bg-ink py-2 text-sm text-paper">New script</button>
        </form>
        <div className="mt-3 space-y-1">
          {scripts.map((s) => (
            <Link
              key={s.id}
              href={`/workspace/scripts?id=${s.id}`}
              className={`block rounded-xl px-3 py-2 text-sm ${s.id === active?.id ? "bg-ink text-paper" : "hover:bg-black/5"}`}
            >
              <p className="truncate font-medium">{s.title}</p>
              <p className="text-[10px] opacity-70">{s.status}</p>
            </Link>
          ))}
        </div>
      </aside>
      {active ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <form action={saveScript} className="space-y-3">
            <input type="hidden" name="id" value={active.id} />
            <input
              name="title"
              defaultValue={active.title}
              className="w-full border-none font-display text-3xl outline-none"
            />
            <div className="flex gap-3">
              <input name="apSubject" defaultValue={active.apSubject ?? ""} placeholder="AP subject" className="rounded-xl border px-3 py-2 text-sm" />
              <input name="apUnit" defaultValue={active.apUnit ?? ""} placeholder="Unit / topic" className="rounded-xl border px-3 py-2 text-sm" />
            </div>
            <textarea
              name="body"
              defaultValue={active.body}
              rows={18}
              className="w-full rounded-2xl border px-4 py-3 font-sans text-sm leading-7"
              placeholder="HOOK: …"
            />
            <div className="flex gap-2">
              <button className="rounded-full border px-4 py-2 text-sm">Save draft</button>
              <button name="submit" value="true" className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
                Submit for review
              </button>
            </div>
          </form>
          {canReview && active.status === "SUBMITTED" ? (
            <form action={reviewScript} className="mt-6 flex flex-wrap gap-2 border-t pt-4">
              <input type="hidden" name="id" value={active.id} />
              <select name="creatorId" className="rounded-xl border px-2 py-1 text-sm">
                <option value="">Assign creator later</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
              <button name="decision" value="approve" className="rounded-full bg-ink px-3 py-1 text-sm text-paper">
                Approve
              </button>
              <button name="decision" value="revise" className="rounded-full border px-3 py-1 text-sm">
                Needs revision
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <p>Create your first script.</p>
      )}
    </div>
  );
}
