import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin, onTeam, requireTeam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writtenPrompts } from "@/lib/course-responses";
import {
  addCourseTopic,
  addCourseUnit,
  deleteCourseTopic,
  deleteCourseUnit,
  saveCoursePrompt,
  saveCourseTest,
  saveCourseTopic,
  saveCourseVideo,
} from "@/actions/courses";

export const dynamic = "force-dynamic";

const field = "w-full rounded-xl border border-black/10 px-3 py-2 text-sm";

export default async function CourseDocPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unit?: string }>;
}) {
  const user = await requireTeam();
  if (!onTeam(user, "FIVE_FOR_FIVE") && !isAdmin(user)) notFound();
  const { id } = await params;
  const { unit: unitQuery } = await searchParams;
  const doc = await prisma.courseDoc.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true } },
      units: {
        orderBy: { sortOrder: "asc" },
        include: {
          topics: { orderBy: { sortOrder: "asc" } },
          prompts: true,
        },
      },
    },
  });
  if (!doc || (!isAdmin(user) && doc.ownerId !== user.id)) notFound();
  const prompts = writtenPrompts(doc.subjectSlug);
  const current = doc.units.find((unit) => unit.id === unitQuery) ?? doc.units[0] ?? null;

  return (
    <div className="max-w-3xl">
      <Link href="/workspace/five" className="text-sm font-semibold text-volt">All course docs</Link>
      <h1 className="mt-2 font-display text-4xl text-ink">{doc.title}</h1>
      <p className="mt-2 text-sm text-ink/70">
        This Google Doc is the whole course. Each tab below is a unit.{" "}
        <a href={doc.docUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-volt">Open the doc</a>
      </p>
      {isAdmin(user) && doc.ownerId !== user.id ? (
        <p className="mt-2 text-xs text-ink/50">{doc.owner.firstName} {doc.owner.lastName} owns this doc.</p>
      ) : null}

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {doc.units.map((unit) => (
          <Link
            key={unit.id}
            href={`/workspace/five/${doc.id}?unit=${unit.id}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${current?.id === unit.id ? "bg-volt text-ink" : "bg-white text-ink"}`}
          >
            {unit.title}
          </Link>
        ))}
      </div>

      <form action={addCourseUnit} className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="courseId" value={doc.id} />
        <input name="title" required placeholder="Unit 1" className="rounded-xl border border-black/10 px-3 py-2 text-sm" />
        <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Add unit tab</button>
      </form>

      {current ? (
        <UnitEditor unit={current} prompts={prompts} />
      ) : (
        <p className="mt-6 text-sm text-ink/60">Add the first unit tab. For AP Human Geography that might be Unit 1. Then put a quiz on each topic inside it.</p>
      )}
    </div>
  );
}

function UnitEditor({
  unit,
  prompts,
}: {
  unit: {
    id: string;
    title: string;
    testBody: string;
    testChecked: boolean;
    videoUrl: string;
    topics: { id: string; title: string; quizBody: string; checked: boolean }[];
    prompts: { id: string; kind: string; body: string; checked: boolean }[];
  };
  prompts: { kind: string; label: string; hint: string }[];
}) {
  const topicsReady = unit.topics.length > 0 && unit.topics.every((topic) => topic.checked);
  const testReady = unit.testChecked;
  const writtenReady = prompts.every((prompt) => unit.prompts.some((row) => row.kind === prompt.kind && row.checked));
  const videoReady = Boolean(unit.videoUrl);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-ink">{unit.title}</h2>
        <form action={deleteCourseUnit}>
          <input type="hidden" name="unitId" value={unit.id} />
          <button className="text-sm text-coral">Remove this unit</button>
        </form>
      </div>
      <p className="text-sm text-ink/70">
        {topicsReady ? "Quizzes checked. " : "Quizzes still need every question checked. "}
        {testReady ? "Unit test checked. " : "Unit test still needs a check. "}
        {writtenReady ? "Written questions checked. " : "Written questions still need a check. "}
        {videoReady ? "Landscape video linked." : "Landscape video still needs a link."}
      </p>

      <section className="rounded-3xl bg-white p-4">
        <h3 className="font-display text-2xl text-ink">Topic quizzes</h3>
        <p className="mt-1 text-sm text-ink/60">One quiz per topic. You write it, then you check every question before you mark it done.</p>
        <div className="mt-4 space-y-4">
          {unit.topics.map((topic) => (
            <form key={topic.id} action={saveCourseTopic} className="rounded-2xl border border-black/10 p-3">
              <input type="hidden" name="topicId" value={topic.id} />
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{topic.title}</p>
                <button formAction={deleteCourseTopic} className="text-xs text-coral">Remove</button>
              </div>
              <textarea name="quiz" rows={5} defaultValue={topic.quizBody} placeholder="Write every question for this topic" className={`${field} mt-2`} />
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" name="checked" defaultChecked={topic.checked} />
                I checked every question
              </label>
              <button className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Save quiz</button>
            </form>
          ))}
        </div>
        <form action={addCourseTopic} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="unitId" value={unit.id} />
          <input name="title" required placeholder="Topic name" className="rounded-xl border border-black/10 px-3 py-2 text-sm" />
          <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold">Add topic quiz</button>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-4">
        <h3 className="font-display text-2xl text-ink">Unit test</h3>
        <p className="mt-1 text-sm text-ink/60">One test for this whole unit. Check it the same way you check the quizzes.</p>
        <form action={saveCourseTest} className="mt-3">
          <input type="hidden" name="unitId" value={unit.id} />
          <textarea name="test" rows={6} defaultValue={unit.testBody} placeholder="The full unit test" className={field} />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="checked" defaultChecked={unit.testChecked} />
            I checked the whole test
          </label>
          <button className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Save test</button>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-4">
        <h3 className="font-display text-2xl text-ink">Written questions</h3>
        <p className="mt-1 text-sm text-ink/60">These match the exam. AP Human Geography is an FRQ. AP World, APUSH, and AP Euro each need an SAQ, a DBQ, and an LEQ.</p>
        <div className="mt-4 space-y-4">
          {prompts.map((prompt) => {
            const row = unit.prompts.find((item) => item.kind === prompt.kind);
            if (!row) return null;
            return (
              <form key={row.id} action={saveCoursePrompt} className="rounded-2xl border border-black/10 p-3">
                <input type="hidden" name="promptId" value={row.id} />
                <p className="font-semibold">{prompt.label}</p>
                <p className="mt-1 text-xs text-ink/50">{prompt.hint}</p>
                <textarea name="body" rows={5} defaultValue={row.body} className={`${field} mt-2`} />
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" name="checked" defaultChecked={row.checked} />
                  I checked this
                </label>
                <button className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Save {prompt.label}</button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4">
        <h3 className="font-display text-2xl text-ink">Landscape unit video</h3>
        <p className="mt-1 text-sm text-ink/60">
          Film landscape, about five minutes, and go deeper than the normal short videos. Paste the link here so it stays with this unit and the course doc.
        </p>
        <form action={saveCourseVideo} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="unitId" value={unit.id} />
          <input name="videoUrl" type="url" defaultValue={unit.videoUrl} placeholder="https://..." className="min-w-0 flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm" />
          <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Link video</button>
        </form>
      </section>
    </div>
  );
}
