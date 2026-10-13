import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { GRADE_LABELS, getRoleByKey } from "@/lib/roles";
import { formatDateTime } from "@/lib/utils";
import { ApplicationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const apps = await prisma.application.findMany({
    where: status ? { status: status as ApplicationStatus } : undefined,
    orderBy: { submittedAt: "desc" },
  });
  const statuses = ["NEW", "UNDER_REVIEW", "WAITLISTED", "ACCEPTED", "REJECTED"];

  return (
    <div>
      <h1 className="font-display text-4xl">Applications</h1>
      <p className="mt-2 text-sm text-paper/60">
        Team applications only. Blitzer study accounts are not in this queue and do not need approval.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/applications" className="rounded-full border border-white/15 px-3 py-1">
          All
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin/applications?status=${s}`} className="rounded-full border border-white/15 px-3 py-1">
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-navy text-paper/60">
            <tr>
              {["ID", "Name", "Grade", "School", "1st role", "Status", "Submitted"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-paper/50" colSpan={7}>
                  No applications yet. Public applications from /apply appear here automatically.
                </td>
              </tr>
            ) : null}
            {apps.map((a) => (
              <tr key={a.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <Link href={`/admin/applications/${a.id}`} className="text-volt">
                    {a.applicationId}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {a.firstName} {a.lastName}
                </td>
                <td className="px-4 py-3">{GRADE_LABELS[a.gradeLevel]}</td>
                <td className="px-4 py-3">{a.highSchool}</td>
                <td className="px-4 py-3">{getRoleByKey(a.firstChoice)?.name}</td>
                <td className="px-4 py-3">{a.status.replace("_", " ")}</td>
                <td className="px-4 py-3">{formatDateTime(a.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
