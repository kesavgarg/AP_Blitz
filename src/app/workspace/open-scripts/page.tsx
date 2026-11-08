import { notFound } from "next/navigation";
import { isFounder, requireTeam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEducationalVideoTaker } from "@/lib/one-time";
import { acceptPublishedScript } from "@/actions/content";
import { LiveRefresh } from "@/components/workspace/live-refresh";

export const dynamic = "force-dynamic";

export default async function OpenScriptsPage() {
  const user = await requireTeam();
  const taker = await isEducationalVideoTaker(user.id, user.role, user.teams);
  if (!taker && !isFounder(user)) notFound();
  const scripts = await prisma.script.findMany({
    where: {
      status: "APPROVED",
      OR: [
        { contentItem: { video: { is: null } } },
        { contentItem: { video: { is: { creatorId: null } } } },
      ],
    },
    include: { contentItem: { include: { video: true } } },
    orderBy: { updatedAt: "desc" },
  });

  // Group by AP subject so each topic is its own section.
  const groups = new Map<string, typeof scripts>();
  for (const script of scripts) {
    const key = script.apSubject || "No subject";
    groups.set(key, [...(groups.get(key) ?? []), script]);
  }
  const sections = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === "No subject") return 1;
    if (b === "No subject") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="max-w-3xl">
      <LiveRefresh />
      <h1 className="font-display text-4xl text-ink">Scripts</h1>
      <p className="mt-2 text-sm text-ink/70">
        These are published. Accept one and it leaves this page. It will show up under Accepted, with a week to finish it.
      </p>
      {scripts.length === 0 ? (
        <p className="mt-6 text-sm text-ink/50">No scripts are waiting right now.</p>
      ) : null}
      <div className="mt-6 space-y-8">
        {sections.map(([subject, items]) => (
          <section key={subject}>
            <h2 className="font-display text-2xl text-ink">
              {subject.replace(/^AP /, "")}
              <span className="ml-2 text-sm font-normal text-ink/40">{items.length}</span>
            </h2>
            <div className="mt-3 space-y-2">
              {items.map((script) => (
                <details key={script.id} className="group rounded-2xl bg-white p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span>
                      <span className="font-display text-lg text-ink">{script.title}</span>
                      {script.apUnit ? <span className="ml-2 text-sm text-ink/50">{script.apUnit}</span> : null}
                    </span>
                    <span className="text-xs text-ink/40 group-open:hidden">Open</span>
                    <span className="hidden text-xs text-ink/40 group-open:inline">Close</span>
                  </summary>
                  <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-black/5 p-4 text-sm text-ink">{script.body}</pre>
                  {taker ? (
                    <form action={acceptPublishedScript} className="mt-4">
                      <input type="hidden" name="id" value={script.id} />
                      <button className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">Accept</button>
                    </form>
                  ) : (
                    <p className="mt-4 text-sm text-ink/60">A video maker accepts this. It then leaves every other maker&apos;s list.</p>
                  )}
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
