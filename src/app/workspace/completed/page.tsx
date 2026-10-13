import { prisma } from "@/lib/prisma";
import { isAdmin, requireUser } from "@/lib/auth";
import { moveContentStage } from "@/actions/pipeline";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompletedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;
  const query = (q || "").trim();
  const items = await prisma.contentItem.findMany({
    where: {
      stage: "COMPLETED",
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { contentId: { contains: query, mode: "insensitive" } },
              { apSubject: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { owner: true, completedBy: true, history: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { completedAt: "desc" },
  });
  return (
    <div>
      <h1 className="font-display text-4xl text-ink">Completed work</h1>
      <p className="mt-2 text-sm text-ink/60">Finished items stay here. Nothing on this page is deleted.</p>
      <form className="mt-4 flex gap-2">
        <input name="q" defaultValue={query} placeholder="Search completed work" className="w-full max-w-md rounded-full border border-black/10 bg-white px-4 py-2" />
        <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">Search</button>
      </form>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl bg-white p-5">
            <p className="text-xs text-ink/40">{item.contentId}</p>
            <h2 className="font-display text-2xl text-ink">{item.title}</h2>
            <p className="text-sm text-ink/60">
              {item.apSubject || "No subject"}
              {item.completedAt ? ` · completed ${formatDateTime(item.completedAt)}` : ""}
              {item.completedBy ? ` by ${item.completedBy.firstName}` : ""}
            </p>
            {item.history.length ? (
              <ul className="mt-2 text-xs text-ink/50">
                {item.history.map((entry) => <li key={entry.id}>{entry.action}</li>)}
              </ul>
            ) : null}
            {isAdmin(user) ? (
              <form action={moveContentStage} className="mt-3">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="stage" value="TODO" />
                <button className="text-sm font-semibold text-ink underline">Reopen</button>
              </form>
            ) : null}
          </article>
        ))}
        {items.length === 0 ? <p className="text-sm text-ink/50">No completed work matches.</p> : null}
      </div>
    </div>
  );
}
