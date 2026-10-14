import { prisma } from "@/lib/prisma";
import { requireFounder } from "@/lib/auth";
import { setTeamLeader, updateMemberRole, addMemberToTeam, removeMemberFromTeam, clearMemberTeams } from "@/actions/admin";
import { isActiveTeamKey, ROLES } from "@/lib/roles";
import { SubmitButton } from "@/components/ui/submit-button";
import { KickButton } from "@/components/admin/kick-button";
import type { PermissionRole, TeamKey } from "@prisma/client";

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
    where: { isActive: true },
    include: { memberships: { include: { team: true } } },
    orderBy: { firstName: "asc" },
  });
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  const members = users.filter((u) => u.role !== "BLITZER");
  const blitzers = users.filter((u) => u.role === "BLITZER");

  return (
    <div>
      <h1 className="font-display text-4xl">Team</h1>
      <p className="mt-2 text-sm text-paper/60">
        Club members are the people who make videos and posts. Blitzers are the student accounts.
        Kicking someone deletes the account. They have to sign up again, and login says no account found.
      </p>
      <Section title="Club members" people={members} />
      <Section title="Blitzers" people={blitzers} />
      <p className="mt-6 text-xs text-paper/40">{teams.length} teams in the org.</p>
    </div>
  );
}

function Section({
  title,
  people,
}: {
  title: string;
  people: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: PermissionRole;
    memberships: Array<{ id: string; teamId: string; isLeader: boolean; team: { key: TeamKey; name: string } }>;
  }>;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-paper/50">{people.length} {people.length === 1 ? "person" : "people"}</p>
      <div className="mt-4 space-y-3">
        {people.length === 0 ? <p className="text-sm text-paper/40">Nobody here yet.</p> : null}
        {people.map((u) => (
          <article key={u.id} className="rounded-3xl border border-white/10 bg-navy p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl">
                  {u.firstName} {u.lastName}
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
                    <KickButton userId={u.id} name={`${u.firstName} ${u.lastName}`} />
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
    </section>
  );
}
