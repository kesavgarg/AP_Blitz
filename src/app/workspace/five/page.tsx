import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin, onTeam, requireTeam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBJECTS } from "@/lib/subjects";
import { ensureFiveForFive } from "@/lib/teams";
import { createCourseDoc } from "@/actions/courses";

export const dynamic = "force-dynamic";

export default async function FiveForFivePage() {
  const user = await requireTeam();
  if (!onTeam(user, "FIVE_FOR_FIVE") && !isAdmin(user)) notFound();
  await ensureFiveForFive();
  const admin = isAdmin(user);
  const docs = await prisma.courseDoc.findMany({
    where: admin ? undefined : { ownerId: user.id },
    include: {
      owner: { select: { firstName: true, lastName: true } },
      units: { select: { id: true, testChecked: true, videoUrl: true, topics: { select: { checked: true } }, prompts: { select: { checked: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-ink">5 For 5</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink/70">
        One Google Doc is one AP course. Add a tab for each unit. In that unit, write a quiz for every topic and check every question, write the unit test, write the written questions that course uses, then link a landscape 5-minute video. This stays here. It does not go into the content pipeline.
      </p>
      <form action={createCourseDoc} className="mt-6 grid gap-3 rounded-3xl bg-white p-4">
        <p className="font-semibold">New course doc</p>
        <select name="subject" required className="rounded-xl border border-black/10 px-3 py-2" defaultValue="">
          <option value="" disabled>Which AP course?</option>
          {SUBJECTS.map((subject) => (
            <option key={subject.slug} value={subject.slug}>{subject.name}</option>
          ))}
        </select>
        <input name="docUrl" type="url" required placeholder="https://docs.google.com/..." className="rounded-xl border border-black/10 px-3 py-2" />
        <p className="text-xs text-ink/50">Paste the Google Doc for the whole course. You will add the unit tabs on the next page.</p>
        <button className="w-fit rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Create course</button>
      </form>
      <div className="mt-6 space-y-3">
        {docs.length === 0 ? <p className="text-sm text-ink/50">No course docs yet.</p> : null}
        {docs.map((doc) => {
          const ready = doc.units.filter((unit) => {
            const topics = unit.topics.length > 0 && unit.topics.every((topic) => topic.checked);
            const prompts = unit.prompts.length > 0 && unit.prompts.every((prompt) => prompt.checked);
            return topics && unit.testChecked && prompts && Boolean(unit.videoUrl);
          }).length;
          return (
            <Link key={doc.id} href={`/workspace/five/${doc.id}`} className="block rounded-3xl bg-white p-4">
              <p className="font-display text-2xl text-ink">{doc.title}</p>
              <p className="mt-1 text-sm text-ink/60">
                {doc.units.length} unit{doc.units.length === 1 ? "" : "s"} · {ready} finished
                {admin ? ` · ${doc.owner.firstName} ${doc.owner.lastName}` : ""}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
