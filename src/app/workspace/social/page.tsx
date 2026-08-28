import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFounder, onTeam, requireUser } from "@/lib/auth";
import { submitSocialIdea, approveIdea } from "@/actions/content";
import { formatDateTime } from "@/lib/utils";

export default async function SocialWorkspace() {
  const user = await requireUser();
  if (!onTeam(user, "SOCIAL_MEDIA") && !isFounder(user)) notFound();
  const ideas = await prisma.socialIdea.findMany({
    include: { contentItem: true, author: true },
    orderBy: { createdAt: "desc" },
  });
  const writers = await prisma.user.findMany({
    where: { memberships: { some: { team: { key: "SCRIPT_WRITER" } } } },
  });
  const canApprove = isFounder(user) || user.role === "TEAM_ADMIN";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h1 className="font-display text-4xl">Social ideas</h1>
        <p className="mt-2 text-ink/60">3+ ideas a week. Trends, skits, posts — get them into the pipeline.</p>
        <form action={submitSocialIdea} className="mt-6 space-y-3 rounded-3xl bg-white p-5 shadow-sm">
          <input name="ideaTitle" required placeholder="Idea title" className="w-full rounded-xl border px-3 py-2" />
          <select name="platform" className="w-full rounded-xl border px-3 py-2">
            <option>Instagram Reels</option>
            <option>TikTok</option>
            <option>YouTube Shorts</option>
            <option>Instagram Post</option>
            <option>Carousel</option>
            <option>Other</option>
          </select>
          <input name="trendLink" placeholder="Link to trend" className="w-full rounded-xl border px-3 py-2" />
          <input name="apSubject" placeholder="AP subject (optional)" className="w-full rounded-xl border px-3 py-2" />
          <textarea name="description" required placeholder="What's the idea?" className="w-full rounded-xl border px-3 py-2" />
          <textarea name="whyItWorks" placeholder="Why it would work" className="w-full rounded-xl border px-3 py-2" />
          <textarea name="suggestedCaption" placeholder="Suggested caption" className="w-full rounded-xl border px-3 py-2" />
          <input name="suggestedFormat" placeholder="Suggested format" className="w-full rounded-xl border px-3 py-2" />
          <button className="rounded-full bg-ink px-4 py-2 text-paper">Submit idea</button>
        </form>
      </div>
      <div className="space-y-3">
        {ideas.map((idea) => (
          <article key={idea.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase text-ink/40">{idea.status} · {idea.contentItem.contentId}</p>
            <h2 className="font-display text-xl">{idea.ideaTitle}</h2>
            <p className="text-sm text-ink/60">{idea.platform}</p>
            <p className="mt-2 text-sm">{idea.description}</p>
            {idea.trendLink ? (
              <a className="text-xs underline" href={idea.trendLink}>
                Trend link
              </a>
            ) : null}
            <p className="mt-2 text-xs text-ink/40">
              {idea.author.firstName} · {formatDateTime(idea.createdAt)}
            </p>
            {canApprove && idea.status === "submitted" ? (
              <form action={approveIdea} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={idea.contentItemId} />
                <select name="writerId" className="rounded-xl border px-2 py-1 text-sm">
                  <option value="">Assign writer later</option>
                  {writers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.firstName} {w.lastName}
                    </option>
                  ))}
                </select>
                <button className="rounded-full bg-ink px-3 py-1 text-sm text-paper">Approve</button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
