import { requireUser } from "@/lib/auth";
import { listSubjects } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { toggleClassAction } from "@/actions/student";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const user = await requireUser();
  const [subjects, selected] = await Promise.all([
    listSubjects(),
    prisma.studentClass.findMany({ where: { userId: user.id }, select: { subjectId: true } }),
  ]);
  const mine = new Set(selected.map((row) => row.subjectId));
  return (
    <div>
      <h1 className="font-display text-4xl">My AP classes</h1>
      <p className="mt-2 text-paper/70">{subjects.length} subjects are available. Add the ones you are taking.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subject) => {
          const on = mine.has(subject.id);
          return (
            <article key={subject.id} className="overflow-hidden rounded-[1.6rem] border border-white/10">
              <Link href={`/videos/${subject.slug}`} className="block p-5" style={{ backgroundColor: subject.color, color: subject.ink }}>
                <p className="text-xs font-bold uppercase tracking-wide opacity-70">{subject.videoCount} videos</p>
                <h2 className="mt-2 font-display text-2xl leading-tight">{subject.name}</h2>
              </Link>
              <form action={toggleClassAction} className="bg-black/40 p-3">
                <input type="hidden" name="subjectId" value={subject.id} />
                <button className="w-full rounded-full border border-white/15 py-2 text-sm font-semibold">
                  {on ? "Remove from my classes" : "Add to my classes"}
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </div>
  );
}
