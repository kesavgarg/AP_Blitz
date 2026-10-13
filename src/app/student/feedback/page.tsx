import { requireUser } from "@/lib/auth";
import { listSubjects } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { FeedbackForm } from "@/components/student/feedback-form";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  await requireUser();
  const [subjects, videos] = await Promise.all([
    listSubjects(),
    prisma.libraryVideo.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { publishedAt: "desc" },
      take: 40,
    }),
  ]);
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl">Feedback</h1>
      <p className="mt-2 text-sm text-paper/70">This goes to the founder. It is not a team application.</p>
      <div className="mt-5">
        <FeedbackForm
          subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
          videos={videos}
        />
      </div>
    </div>
  );
}
