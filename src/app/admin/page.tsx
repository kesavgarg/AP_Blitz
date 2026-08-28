import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleByKey } from "@/lib/roles";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await requireAdmin();
  const now = new Date();
  const [members, pendingApps, recentApps, activeTasks, overdue, meetings, inProd] =
    await Promise.all([
      prisma.user.count({ where: { isActive: true, role: { not: "FOUNDER" } } }),
      prisma.application.count({ where: { status: { in: ["NEW", "UNDER_REVIEW"] } } }),
      prisma.application.findMany({
        orderBy: { submittedAt: "desc" },
        take: 8,
      }),
      prisma.task.count({ where: { status: { not: "COMPLETED" } } }),
      prisma.task.count({ where: { deadline: { lt: now }, status: { not: "COMPLETED" } } }),
      prisma.meeting.count({ where: { startAt: { gte: now } } }),
      prisma.contentItem.count({ where: { status: { not: "PUBLISHED" } } }),
    ]);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-volt">Founder control center</p>
      <h1 className="mt-2 font-display text-4xl">Hey {user.firstName}.</h1>
      <p className="mt-2 text-sm text-paper/60">
        These numbers are live from the database — not sample data. New applications land here
        the second someone hits submit.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card n={pendingApps} l="Pending applications" href="/admin/applications" />
        <Card n={members} l="Accepted team members" href="/admin/team" />
        <Card n={activeTasks} l="Open tasks" href="/workspace/tasks" />
        <Card n={overdue} l="Overdue tasks" href="/workspace/tasks" />
        <Card n={inProd} l="Content in production" href="/admin/content" />
        <Card n={meetings} l="Upcoming meetings" href="/workspace/meetings" />
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-navy p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Application inbox</h2>
          <Link href="/admin/applications" className="text-sm text-volt">
            View all
          </Link>
        </div>
        {recentApps.length === 0 ? (
          <p className="mt-4 text-sm text-paper/50">
            No applications yet. When a student applies on the public site, their form shows up
            here for you to accept or decline.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-paper/50">
                <tr>
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((a) => (
                  <tr key={a.id} className="border-t border-white/10">
                    <td className="py-3 pr-3">
                      <Link className="text-volt" href={`/admin/applications/${a.id}`}>
                        {a.applicationId}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">
                      {a.firstName} {a.lastName}
                      <div className="text-xs text-paper/40">{a.email}</div>
                    </td>
                    <td className="py-3 pr-3">{getRoleByKey(a.firstChoice)?.name}</td>
                    <td className="py-3 pr-3">{a.status.replaceAll("_", " ")}</td>
                    <td className="py-3">{formatDateTime(a.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ n, l, href }: { n: number; l: string; href: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-white/10 bg-navy p-5">
      <p className="font-display text-3xl">{n}</p>
      <p className="text-sm text-paper/60">{l}</p>
    </Link>
  );
}
