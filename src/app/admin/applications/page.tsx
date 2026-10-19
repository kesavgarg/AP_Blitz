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
  const joiners = await prisma.application.findMany({
    where: { commitment: "ONE_TIME", status: "ACCEPTED", joinRequestedAt: { not: null } },
    orderBy: { joinRequestedAt: "desc" },
  });
  const apps = await prisma.application.findMany({
    where: status ? { status: status as ApplicationStatus } : undefined,
    orderBy: { submittedAt: "desc" },
  });
  const blitzers = await prisma.user.findMany({
    where: { role: "BLITZER", isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, highSchool: true },
  });
  const members = apps.filter((app) => app.commitment !== "ONE_TIME");
  const oneTimers = apps.filter((app) => app.commitment === "ONE_TIME");
  const acceptedMembers = members.filter((app) => app.status === "ACCEPTED").length;
  const statuses = ["NEW", "UNDER_REVIEW", "WAITLISTED", "ACCEPTED", "REJECTED"];

  return (
    <div>
      <h1 className="font-display text-4xl">Applications</h1>
      <p className="mt-2 text-sm text-paper/60">
        Three separate lists. Blitzers are study accounts. They are not part of the accepted member count ({acceptedMembers}).
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
      {joiners.length ? (
        <div className="mt-6 space-y-2">
          {joiners.map((joiner) => (
            <Link key={joiner.id} href={`/admin/applications/${joiner.id}`} className="block rounded-2xl border border-volt/40 bg-volt/10 px-4 py-3 text-sm">
              {joiner.firstName} {joiner.lastName} wants to join the team. Pick their team.
            </Link>
          ))}
        </div>
      ) : null}
      <Section title="Members" note={`${acceptedMembers} accepted. This number does not include one timers or Blitzers.`} rows={members} />
      <Section title="One timers" note="One video, then they can ask to join a team." rows={oneTimers} />
      <section className="mt-8">
        <h2 className="font-display text-2xl">Blitzers</h2>
        <p className="mt-1 text-sm text-paper/50">{blitzers.length} study accounts. Not part of the accepted member count.</p>
        <div className="mt-3 overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-navy text-paper/60">
              <tr>
                {["Name", "Email", "School", "Joined"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blitzers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-paper/50" colSpan={4}>No Blitzers yet.</td>
                </tr>
              ) : null}
              {blitzers.map((person) => (
                <tr key={person.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{person.firstName} {person.lastName}</td>
                  <td className="px-4 py-3">{person.email}</td>
                  <td className="px-4 py-3">{person.highSchool || "—"}</td>
                  <td className="px-4 py-3">{formatDateTime(person.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  note,
  rows,
}: {
  title: string;
  note: string;
  rows: Array<{
    id: string;
    applicationId: string;
    firstName: string;
    lastName: string;
    gradeLevel: string;
    highSchool: string;
    commitment: string;
    videoLane: string;
    firstChoice: Parameters<typeof getRoleByKey>[0];
    status: string;
    submittedAt: Date;
  }>;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-paper/50">{note}</p>
      <div className="mt-3 overflow-x-auto rounded-3xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-navy text-paper/60">
            <tr>
              {["ID", "Name", "Grade", "School", "Role", "Status", "Submitted"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-paper/50" colSpan={7}>Nobody in this section yet.</td>
              </tr>
            ) : null}
            {rows.map((app) => (
              <tr key={app.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <Link href={`/admin/applications/${app.id}`} className="text-volt">{app.applicationId}</Link>
                </td>
                <td className="px-4 py-3">{app.firstName} {app.lastName}</td>
                <td className="px-4 py-3">{GRADE_LABELS[app.gradeLevel]}</td>
                <td className="px-4 py-3">{app.highSchool}</td>
                <td className="px-4 py-3">
                  {app.commitment === "ONE_TIME"
                    ? "One video"
                    : app.videoLane === "PROMOTIONAL"
                      ? "Promotional videos"
                      : app.videoLane === "EDUCATIONAL"
                        ? "Educational videos"
                        : getRoleByKey(app.firstChoice)?.name}
                </td>
                <td className="px-4 py-3">{app.status.replace("_", " ")}</td>
                <td className="px-4 py-3">{formatDateTime(app.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
