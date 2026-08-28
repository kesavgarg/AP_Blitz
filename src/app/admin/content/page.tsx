import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { advanceContent } from "@/actions/content";
import { CONTENT_STATUS_LABELS, PIPELINE_STEPS, pipelineIndex } from "@/lib/utils";

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
        Idea → script → record → edit → graphics → SEO → review → publish.
      </p>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-navy p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-volt">{item.contentId}</p>
                <h2 className="font-display text-2xl">{item.title}</h2>
                <p className="text-sm text-paper/50">
                  {CONTENT_STATUS_LABELS[item.status]} · {item.owner?.firstName ?? "unassigned"}
                </p>
              </div>
              <Link href={`/workspace/content/${item.id}`} className="text-sm text-volt">
                Open
              </Link>
            </div>
            <div className="mt-3 flex gap-1 overflow-x-auto">
              {PIPELINE_STEPS.map((s, i) => (
                <span
                  key={s.key}
                  className={`rounded-full px-2 py-0.5 text-[10px] ${i <= pipelineIndex(item.status) ? "bg-volt text-ink" : "bg-white/10"}`}
                >
                  {s.label}
                </span>
              ))}
            </div>
            <form action={advanceContent} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={item.id} />
              <select name="status" defaultValue={item.status} className="rounded-xl bg-ink px-2 py-1 text-sm">
                {Object.keys(CONTENT_STATUS_LABELS).map((s) => (
                  <option key={s} value={s}>
                    {CONTENT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <input name="publishAt" type="datetime-local" className="rounded-xl bg-ink px-2 py-1 text-sm" />
              <button className="rounded-full bg-volt px-3 py-1 text-sm font-semibold text-ink">Update</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
