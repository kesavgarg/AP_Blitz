import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireUser } from "@/lib/auth";
import { createPipelineItem, moveContentStage } from "@/actions/pipeline";
import { WORK_STAGES } from "@/lib/stages";
import { AP_SUBJECTS } from "@/lib/ap-subjects";
import { formatDate } from "@/lib/utils";
import { workspaceForTeam } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const user = await requireUser();
  const [items, people] = await Promise.all([
    prisma.contentItem.findMany({
      where: { stage: { not: "COMPLETED" } },
      include: { owner: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["FOUNDER", "TEAM_ADMIN", "MEMBER"] } },
      orderBy: { firstName: "asc" },
    }),
  ]);
  const tools = user.role === "FOUNDER"
    ? [
        ["/workspace/scripts", "Scripts"],
        ["/workspace/video", "Recording"],
        ["/workspace/edit", "Editing"],
        ["/workspace/design", "Design"],
        ["/workspace/social", "Social ideas"],
      ]
    : user.teams.filter((team) => team.key !== "SEO").map((team) => [workspaceForTeam(team.key), team.name]);

  return (
    <div>
      <h1 className="font-display text-4xl text-ink">Content pipeline</h1>
      <p className="mt-2 text-sm text-ink/60">To Do, In Progress, Needs Review, then Completed. Finished work leaves this board.</p>
      <form action={createPipelineItem} className="mt-6 grid gap-3 rounded-3xl bg-white p-4 md:grid-cols-4">
        <input name="title" required placeholder="Title" className="rounded-xl border border-black/10 px-3 py-2" />
        <select name="apSubject" className="rounded-xl border border-black/10 px-3 py-2">
          <option value="">Subject</option>
          {AP_SUBJECTS.map((name) => <option key={name}>{name}</option>)}
        </select>
        <input name="apUnit" placeholder="Unit" className="rounded-xl border border-black/10 px-3 py-2" />
        <select name="ownerId" defaultValue={user.id} className="rounded-xl border border-black/10 px-3 py-2">
          {people.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
        </select>
        <input name="deadline" type="date" className="rounded-xl border border-black/10 px-3 py-2" />
        <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper md:col-span-2">Add to To Do</button>
      </form>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {WORK_STAGES.filter((stage) => stage.key !== "COMPLETED").map((stage) => (
          <section key={stage.key} className="rounded-3xl bg-white p-3">
            <h2 className="px-2 font-display text-2xl text-ink">{stage.label}</h2>
            <div className="mt-3 space-y-3">
              {items.filter((item) => item.stage === stage.key).map((item) => (
                <article key={item.id} className="rounded-2xl border border-black/5 p-3">
                  <p className="text-xs text-ink/40">{item.contentId}</p>
                  <h3 className="font-medium text-ink">{item.title}</h3>
                  <p className="text-xs text-ink/50">{item.apSubject || "No subject"} · {item.owner?.firstName || "Unassigned"}{item.deadline ? ` · ${formatDate(item.deadline)}` : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {WORK_STAGES.map((next) => (
                      <form key={next.key} action={moveContentStage}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="stage" value={next.key} />
                        <button className="rounded-full bg-black/5 px-2 py-1 text-[11px] text-ink" disabled={next.key === item.stage}>
                          {next.label}
                        </button>
                      </form>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="font-display text-2xl text-ink">Role tools</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {tools.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm text-ink">{label}</Link>
          ))}
          {isAdmin(user) ? <Link href="/admin/applications" className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm text-ink">Applications</Link> : null}
        </div>
      </div>
    </div>
  );
}
