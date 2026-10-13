import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { moveContentStage } from "@/actions/pipeline";
import { WORK_STAGES } from "@/lib/stages";

export default async function AdminContentPage() {
  await requireAdmin();
  const items = await prisma.contentItem.findMany({
    include: { owner: true, team: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-4xl">Content pipeline</h1>
      <p className="mt-2 text-paper/60">
        Active work uses four stages: To Do, In Progress, Needs Review, Completed.
        Publishing a video is separate and happens on the Videos page.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/workspace/pipeline" className="text-volt">Open the board</Link>
        {" · "}
        <Link href="/workspace/completed" className="text-volt">Completed work</Link>
      </p>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-navy p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-volt">{item.contentId}</p>
                <h2 className="font-display text-2xl">{item.title}</h2>
                <p className="text-sm text-paper/50">
                  {WORK_STAGES.find((stage) => stage.key === item.stage)?.label} · {item.owner?.firstName ?? "unassigned"}
                </p>
              </div>
              <Link href={`/workspace/content/${item.id}`} className="text-sm text-volt">
                Open
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {WORK_STAGES.map((stage) => (
                <form key={stage.key} action={moveContentStage}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="stage" value={stage.key} />
                  <button className={`rounded-full px-3 py-1 text-xs font-semibold ${item.stage === stage.key ? "bg-volt text-ink" : "bg-white/10"}`}>
                    {stage.label}
                  </button>
                </form>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
