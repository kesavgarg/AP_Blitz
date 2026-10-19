import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEducationalVideoTaker } from "@/lib/one-time";
import { acceptPublishedScript } from "@/actions/content";

export const dynamic = "force-dynamic";

export default async function OpenScriptsPage() {
  const user = await requireTeam();
  if (!(await isEducationalVideoTaker(user.id, user.role))) notFound();
  const rows = await prisma.script.findMany({
    where: { status: "APPROVED" },
    include: { contentItem: { include: { video: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const scripts = rows.filter((script) => !script.contentItem.video?.creatorId);

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
            <form action={acceptPublishedScript} className="mt-4">
              <input type="hidden" name="id" value={script.id} />
              <button className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">Accept</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
