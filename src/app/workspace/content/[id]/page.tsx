import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFounder, onTeam, requireUser } from "@/lib/auth";
import { CONTENT_STATUS_LABELS, formatDateTime, pipelineIndex, PIPELINE_STEPS } from "@/lib/utils";

export default async function ContentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      team: true,
      owner: true,
      socialIdea: true,
      script: true,
      video: true,
      designRequests: { include: { files: true } },
      seoRequest: true,
      files: true,
      history: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!item) notFound();
  const allowed =
    isFounder(user) ||
    item.ownerId === user.id ||
    (item.team && onTeam(user, item.team.key)) ||
    user.role === "TEAM_ADMIN";
  if (!allowed) notFound();
  const step = pipelineIndex(item.status);

  return (
    <div>
      <p className="text-xs uppercase text-ink/40">{item.contentId}</p>
      <h1 className="font-display text-4xl">{item.title}</h1>
      <p className="text-sm text-ink/50">
        {item.apSubject} {item.apUnit} · {CONTENT_STATUS_LABELS[item.status]} · owner{" "}
        {item.owner ? `${item.owner.firstName}` : "—"}
      </p>
      <div className="mt-6 flex gap-2 overflow-x-auto">
        {PIPELINE_STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`rounded-full px-3 py-1 text-xs ${i <= step ? "bg-ink text-paper" : "bg-white"}`}
          >
            {s.label}
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl">History</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {item.history.map((h) => (
              <li key={h.id}>
                {h.action} · {formatDateTime(h.createdAt)}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl">Files</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {item.files.map((f) => (
              <li key={f.id}>
                <a className="underline" href={`/api/files/${f.id}`}>
                  {f.filename}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
