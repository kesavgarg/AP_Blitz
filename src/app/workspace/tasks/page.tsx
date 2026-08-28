import { prisma } from "@/lib/prisma";
import { isFounder, requireUser } from "@/lib/auth";
import { createTask, updateTaskStatus } from "@/actions/tasks";
import { formatDateTime } from "@/lib/utils";
import { getRoleByKey } from "@/lib/roles";

export default async function TasksPage() {
  const user = await requireUser();
  const keys = user.teams.map((t) => t.key);
  const tasks = await prisma.task.findMany({
    where: isFounder(user)
      ? undefined
      : {
          OR: [{ assigneeId: user.id }, { creatorId: user.id }, { teamKey: { in: keys } }],
        },
    include: { assignee: true, creator: true },
    orderBy: { createdAt: "desc" },
  });
  const members = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { firstName: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-4xl">My Tasks</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3">
          {tasks.map((t) => (
            <article key={t.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl">{t.title}</p>
                  <p className="text-sm text-ink/60">{t.description}</p>
                  <p className="mt-2 text-xs text-ink/40">
                    {t.assignee ? `Assigned to ${t.assignee.firstName}` : "Unassigned"}
                    {t.deadline ? ` · due ${formatDateTime(t.deadline)}` : ""}
                    {t.teamKey ? ` · ${getRoleByKey(t.teamKey)?.name}` : ""}
                  </p>
                </div>
                <form action={updateTaskStatus} className="text-sm">
                  <input type="hidden" name="id" value={t.id} />
                  <select name="status" defaultValue={t.status} className="rounded-xl border px-2 py-1">
                    <option value="TODO">To do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="NEEDS_REVISION">Needs revision</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <button className="ml-2 text-xs underline">Save</button>
                </form>
              </div>
            </article>
          ))}
        </div>
        {user.role !== "MEMBER" ? (
          <form action={createTask} className="h-fit rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl">Assign a task</h2>
            <div className="mt-4 space-y-3 text-sm">
              <input name="title" required placeholder="Title" className="w-full rounded-xl border px-3 py-2" />
              <textarea name="description" placeholder="Details" className="w-full rounded-xl border px-3 py-2" />
              <select name="assigneeId" className="w-full rounded-xl border px-3 py-2">
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
              <select name="teamKey" className="w-full rounded-xl border px-3 py-2">
                <option value="">Any team</option>
                <option value="VIDEO_CREATOR">Video</option>
                <option value="SCRIPT_WRITER">Scripts</option>
                <option value="VIDEO_EDITOR">Edit</option>
                <option value="SOCIAL_MEDIA">Social</option>
                <option value="GRAPHIC_DESIGN">Design</option>
                <option value="SEO">SEO</option>
              </select>
              <input name="deadline" type="datetime-local" className="w-full rounded-xl border px-3 py-2" />
              <button className="rounded-full bg-ink px-4 py-2 text-paper">Create task</button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
