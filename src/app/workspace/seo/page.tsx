import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFounder, onTeam, requireUser } from "@/lib/auth";
import { saveSeo } from "@/actions/content";

export default async function SeoWorkspace() {
  const user = await requireUser();
  if (!onTeam(user, "SEO") && !isFounder(user)) notFound();
  const requests = await prisma.seoRequest.findMany({
    include: { contentItem: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-4xl">SEO workspace</h1>
      <p className="mt-2 text-ink/60">Titles, alts, keywords, descriptions, hashtags — then submit to admin.</p>
      <div className="mt-6 space-y-4">
        {requests.map((r) => (
          <form key={r.id} action={saveSeo} className="rounded-3xl bg-white p-5 shadow-sm">
            <input type="hidden" name="id" value={r.id} />
            <p className="text-xs uppercase text-ink/40">
              {r.contentItem.contentId} · {r.status}
            </p>
            <h2 className="font-display text-2xl">{r.contentItem.title}</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input name="title" defaultValue={r.title ?? ""} placeholder="Title" className="rounded-xl border px-3 py-2" />
              <input name="altTitles" defaultValue={r.altTitles ?? ""} placeholder="Alternate titles" className="rounded-xl border px-3 py-2" />
              <input name="keywords" defaultValue={r.keywords ?? ""} placeholder="Keywords" className="rounded-xl border px-3 py-2" />
              <input name="hashtags" defaultValue={r.hashtags ?? ""} placeholder="Hashtags" className="rounded-xl border px-3 py-2" />
              <input name="searchTerms" defaultValue={r.searchTerms ?? ""} placeholder="Search terms" className="rounded-xl border px-3 py-2 md:col-span-2" />
              <textarea name="description" defaultValue={r.description ?? ""} placeholder="Description" className="rounded-xl border px-3 py-2 md:col-span-2" />
              <textarea name="notes" defaultValue={r.notes ?? ""} placeholder="Notes" className="rounded-xl border px-3 py-2 md:col-span-2" />
            </div>
            <div className="mt-3 flex gap-2">
              <button className="rounded-full border px-4 py-2 text-sm">Save</button>
              <button name="submit" value="true" className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
                Submit to admin
              </button>
            </div>
          </form>
        ))}
        {!requests.length ? <p className="text-ink/50">Nothing in SEO yet. Approved edits will land here.</p> : null}
      </div>
    </div>
  );
}
