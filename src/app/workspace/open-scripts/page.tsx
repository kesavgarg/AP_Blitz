import { notFound } from "next/navigation";
import { isFounder, requireTeam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEducationalVideoTaker } from "@/lib/one-time";
import { acceptPublishedScript } from "@/actions/content";

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

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-ink">Scripts</h1>
      <p className="mt-2 text-sm text-ink/70">
        These are published. Accept one and it leaves this page. It will show up under Accepted, with a week to finish it.
      </p>
      <div className="mt-6 space-y-4">
        {scripts.length === 0 ? <p className="text-sm text-ink/50">No scripts are waiting right now.</p> : null}
        {scripts.map((script) => (
          <article key={script.id} className="rounded-3xl bg-white p-5">
            <h2 className="font-display text-2xl text-ink">{script.title}</h2>
            <p className="mt-1 text-sm text-ink/50">
              {script.apSubject || "No subject"}
              {script.apUnit ? ` · ${script.apUnit}` : ""}
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-black/5 p-4 text-sm text-ink">{script.body}</pre>
            {taker ? (
              <form action={acceptPublishedScript} className="mt-4">
                <input type="hidden" name="id" value={script.id} />
                <button className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">Accept</button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-ink/60">A video maker accepts this. It then leaves every other maker&apos;s list.</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
