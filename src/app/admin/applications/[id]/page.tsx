import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { GRADE_LABELS, getRoleByKey, ROLES } from "@/lib/roles";
import { formatDateTime } from "@/lib/utils";
import { acceptApplication, rejectApplication, updateApplicationStatus } from "@/actions/admin";

export default async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) notFound();
  const nos = [
    app.expectContribute,
    app.expectRespond,
    app.expectRemoval,
    app.expectConduct,
    app.expectDeadlines,
  ].filter((v) => v === "NO").length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-3xl border border-white/10 bg-navy p-6">
        <p className="text-xs text-volt">{app.applicationId}</p>
        <h1 className="font-display text-4xl">
          {app.firstName} {app.lastName}
        </h1>
        <p className="text-sm text-paper/60">
          {GRADE_LABELS[app.gradeLevel]} · {app.highSchool} · {app.cityCounty}
        </p>
        <p className="mt-2 text-sm">
          {app.email} · {app.phone}
        </p>
        <p className="mt-2 text-xs text-paper/40">Submitted {formatDateTime(app.submittedAt)}</p>
        {nos > 0 ? (
          <p className="mt-4 rounded-xl bg-coral/20 px-3 py-2 text-sm text-coral">
            Answered No to {nos} expectation question{nos > 1 ? "s" : ""}.
          </p>
        ) : null}
        <Section t="AP classes" b={app.apClasses} />
        <Section t="First choice" b={getRoleByKey(app.firstChoice)?.name ?? ""} />
        <Section t="Second choice" b={getRoleByKey(app.secondChoice)?.name ?? ""} />
        <Section t="Experience" b={app.experience || "—"} />
        <Section t="Deadline scenario" b={app.deadlineScenario} />
        <Section t="Additional" b={app.additionalInfo || "—"} />
        <div className="mt-6 grid gap-2 text-sm">
          <p>Contribute (not just GC): {app.expectContribute}</p>
          <p>Respond in reasonable time: {app.expectRespond}</p>
          <p>Inactivity may mean removal: {app.expectRemoval}</p>
          <p>Educational, not spam: {app.expectConduct}</p>
          <p>Meet deadlines: {app.expectDeadlines}</p>
        </div>
      </article>
      <div className="space-y-4">
        {app.status === "ACCEPTED" && app.issuedTempPassword ? (
          <div className="rounded-3xl border border-volt/40 bg-volt/10 p-5 text-sm">
            <p className="font-display text-xl text-volt">Accepted {app.firstName} {app.lastName}</p>
            <p className="mt-2">
              Congratulations email + temporary password{" "}
              {app.lastEmailStatus === "sent" ? "were sent" : "were prepared"} for{" "}
              <strong>{app.email}</strong>. They log in at /login and land in the workspace
              (calendar, messages, tasks).
            </p>
            <p className="mt-3 rounded-xl bg-black/40 px-3 py-2 font-mono text-xs">
              Email: {app.email}
              <br />
              Temp password: {app.issuedTempPassword}
            </p>
            {app.lastEmailStatus === "sent" ? (
              <p className="mt-2 text-emerald-400">Email sent to their personal inbox.</p>
            ) : (
              <p className="mt-2 text-coral">
                Email did not send{app.lastEmailStatus ? ` (${app.lastEmailStatus})` : ""}. Copy
                the password above and text it, then add SMTP in Settings so the next one goes
                out automatically.
              </p>
            )}
          </div>
        ) : null}
        <form action={updateApplicationStatus} className="rounded-3xl border border-white/10 bg-navy p-5">
          <h2 className="font-display text-xl">Status</h2>
          <input type="hidden" name="id" value={app.id} />
          <select name="status" defaultValue={app.status} className="mt-3 w-full rounded-xl bg-ink px-3 py-2">
            <option value="NEW">New</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="WAITLISTED">Waitlisted</option>
          </select>
          <button className="mt-3 rounded-full border border-white/20 px-4 py-2 text-sm">Update</button>
        </form>
        {app.status !== "ACCEPTED" ? (
          <form action={acceptApplication} className="rounded-3xl border border-volt/30 bg-navy p-5">
            <h2 className="font-display text-xl">Accept</h2>
            <p className="mt-1 text-sm text-paper/60">
              Creates their account, emails congratulations + a temporary password to{" "}
              <strong>{app.email}</strong>, and lets them log in to the workspace.
            </p>
            <input type="hidden" name="id" value={app.id} />
            <select name="role" defaultValue={app.firstChoice} className="mt-3 w-full rounded-xl bg-ink px-3 py-2">
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" name="makeLeader" /> Make team lead
            </label>
            <button className="mt-4 rounded-full bg-volt px-4 py-2 font-semibold text-ink">
              Accept and email them
            </button>
          </form>
        ) : (
          <p className="rounded-3xl border border-white/10 p-5 text-sm">
            Accepted{app.assignedRole ? ` as ${getRoleByKey(app.assignedRole)?.name}` : ""}. They
            can log in with the temporary password that was emailed to {app.email}.
          </p>
        )}
        {app.status !== "REJECTED" ? (
          <form action={rejectApplication} className="rounded-3xl border border-white/10 bg-navy p-5">
            <h2 className="font-display text-xl">Decline</h2>
            <p className="mt-1 text-sm text-paper/60">
              Emails a decision to <strong>{app.email}</strong>.
            </p>
            <input type="hidden" name="id" value={app.id} />
            <textarea name="reason" placeholder="Optional note for the email" className="mt-3 w-full rounded-xl bg-ink px-3 py-2" />
            <button className="mt-4 rounded-full border border-coral/40 px-4 py-2 text-sm text-coral">
              Decline and email them
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function Section({ t, b }: { t: string; b: string }) {
  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-wider text-paper/40">{t}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{b}</p>
    </div>
  );
}
