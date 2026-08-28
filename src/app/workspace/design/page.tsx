import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFounder, onTeam, requireUser } from "@/lib/auth";
import { createDesignRequest, submitDesign } from "@/actions/content";
import { formatDate } from "@/lib/utils";

export default async function DesignWorkspace() {
  const user = await requireUser();
  if (!onTeam(user, "GRAPHIC_DESIGN") && !isFounder(user) && user.role !== "TEAM_ADMIN") notFound();
  const requests = await prisma.designRequest.findMany({
    include: { files: true, contentItem: true },
    orderBy: { createdAt: "desc" },
  });
  const designers = await prisma.user.findMany({
    where: { memberships: { some: { team: { key: "GRAPHIC_DESIGN" } } } },
  });
  const content = await prisma.contentItem.findMany({ orderBy: { createdAt: "desc" }, take: 30 });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <h1 className="font-display text-4xl">Graphic design</h1>
        {(isFounder(user) || user.role === "TEAM_ADMIN") && (
          <form action={createDesignRequest} className="mt-6 space-y-3 rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl">New request</h2>
            <input name="title" required placeholder="Title" className="w-full rounded-xl border px-3 py-2" />
            <select name="type" className="w-full rounded-xl border px-3 py-2">
              <option value="INSTAGRAM_POST">Instagram post</option>
              <option value="INSTAGRAM_CAROUSEL">Instagram carousel</option>
              <option value="THUMBNAIL">Thumbnail</option>
              <option value="INFOGRAPHIC">Infographic</option>
              <option value="STORY">Story</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea name="description" placeholder="Description" className="w-full rounded-xl border px-3 py-2" />
            <input name="dimensions" placeholder="Required dimensions" className="w-full rounded-xl border px-3 py-2" />
            <input name="referenceUrl" placeholder="Reference material / URL" className="w-full rounded-xl border px-3 py-2" />
            <input name="deadline" type="datetime-local" className="w-full rounded-xl border px-3 py-2" />
            <select name="assigneeId" className="w-full rounded-xl border px-3 py-2">
              <option value="">Unassigned</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
            <select name="contentItemId" className="w-full rounded-xl border px-3 py-2">
              <option value="">No linked content</option>
              {content.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contentId} · {c.title}
                </option>
              ))}
            </select>
            <button className="rounded-full bg-ink px-4 py-2 text-paper">Create request</button>
          </form>
        )}
      </div>
      <div className="space-y-3">
        {requests.map((r) => (
          <article key={r.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase text-ink/40">
              {r.type.replace("_", " ")} · {r.status}
            </p>
            <h2 className="font-display text-xl">{r.title}</h2>
            <p className="text-sm">{r.description}</p>
            <p className="mt-1 text-xs text-ink/40">
              {r.dimensions} {r.deadline ? `· due ${formatDate(r.deadline)}` : ""}
            </p>
            {r.canvaLink ? (
              <a className="text-sm underline" href={r.canvaLink}>
                Canva link
              </a>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {r.files.map((f) => (
                <a key={f.id} href={`/api/files/${f.id}`} className="rounded-full bg-[#f7f3eb] px-3 py-1 text-xs">
                  {f.filename}
                </a>
              ))}
            </div>
            <form action={submitDesign} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input type="file" name="file" accept=".png,.jpg,.jpeg,.pdf,.webp" />
              <input name="canvaLink" placeholder="Canva link" className="rounded-xl border px-3 py-1 text-sm" />
              <button className="rounded-full bg-ink px-3 py-1 text-sm text-paper">Upload</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
