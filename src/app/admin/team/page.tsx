import { prisma } from "@/lib/prisma";
import { requireFounder } from "@/lib/auth";
import { deactivateUser, setTeamLeader, updateMemberRole, addMemberToTeam, removeMemberFromTeam, clearMemberTeams } from "@/actions/admin";
import { isActiveTeamKey, ROLES } from "@/lib/roles";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function AdminTeamPage() {
  await requireFounder();
  await prisma.teamMembership.deleteMany({ where: { team: { key: "SEO" } } });
  await prisma.messageChannel.deleteMany({ where: { key: "SEO" } });
  const seoTeam = await prisma.team.findUnique({ where: { key: "SEO" } });
  if (seoTeam) {
    await prisma.contentItem.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.calendarEvent.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.meeting.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.dailyLog.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.designRequest.updateMany({ where: { teamId: seoTeam.id }, data: { teamId: null } });
    await prisma.team.delete({ where: { id: seoTeam.id } }).catch(() => undefined);
  }
  const users = await prisma.user.findMany({
    include: { memberships: { include: { team: true } } },
    orderBy: { firstName: "asc" },
  });
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-4xl">Team</h1>
      <p className="mt-2 text-sm text-paper/60">
        Real accepted members only. Demo accounts are gone — people show up here after you accept
        their application.
      </p>
      <div className="mt-6 space-y-3">
        {users.map((u) => (
          <article key={u.id} className="rounded-3xl border border-white/10 bg-navy p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl">
                  {u.firstName} {u.lastName}{" "}
                  {!u.isActive ? <span className="text-xs text-coral">inactive</span> : null}
                </p>
                <p className="text-sm text-paper/50">{u.email}</p>
                <p className="mt-1 text-xs text-paper/40">
                  {u.memberships
                    .filter((m) => isActiveTeamKey(m.team.key))
                    .map((m) => `${m.team.name}${m.isLeader ? " (lead)" : ""}`)
                    .join(" · ") || "No team"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <form action={updateMemberRole} className="flex gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <select name="role" defaultValue={u.role === "FOUNDER" ? "FOUNDER" : u.role} className="rounded-lg bg-ink px-2 py-1">
                    {u.role === "FOUNDER" ? <option value="FOUNDER">Founder</option> : null}
                    <option value="MEMBER">Member</option>
                    <option value="TEAM_ADMIN">Team admin</option>
                    <option value="BLITZER">Blitzer</option>
                  </select>
                  <button className="underline">Save</button>
                </form>
                {u.role !== "FOUNDER" ? (
                  <>
                    <form action={clearMemberTeams}>
                      <input type="hidden" name="userId" value={u.id} />
                      <SubmitButton className="text-coral">Remove all teams and roles</SubmitButton>
                    </form>
                    <form action={deactivateUser}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button className="text-coral">Deactivate</button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {u.memberships
                .filter((m) => isActiveTeamKey(m.team.key))
                .map((m) => (
                  <div key={m.id} className="flex flex-wrap gap-1">
                    <form action={setTeamLeader}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="teamId" value={m.teamId} />
                      <input type="hidden" name="isLeader" value={m.isLeader ? "false" : "true"} />
                      <button className="rounded-full border border-white/15 px-3 py-1 text-xs">
                        {m.isLeader ? `Remove ${m.team.name} lead` : `Make ${m.team.name} lead`}
                      </button>
                    </form>
                    <form action={removeMemberFromTeam}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="teamId" value={m.teamId} />
                      <SubmitButton className="rounded-full border border-coral/40 px-3 py-1 text-xs text-coral">
                        Remove {m.team.name}
                      </SubmitButton>
                    </form>
                  </div>
                ))}
              {ROLES.filter((r) => !u.memberships.some((m) => m.team.key === r.key)).length ? (
                <form action={addMemberToTeam} className="flex gap-1">
                  <input type="hidden" name="userId" value={u.id} />
                  <select name="teamKey" className="rounded-lg bg-ink px-2 py-1 text-xs">
                    {ROLES.filter((r) => !u.memberships.some((m) => m.team.key === r.key)).map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.shortName}
                      </option>
                    ))}
                  </select>
                  <SubmitButton className="rounded-full border border-volt/40 px-3 py-1 text-xs text-volt">
                    Add role
                  </SubmitButton>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-paper/40">{teams.length} teams in the org.</p>
    </div>
  );
}
