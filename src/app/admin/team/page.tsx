import { prisma } from "@/lib/prisma";
import { requireFounder } from "@/lib/auth";
import { deactivateUser, setTeamLeader, updateMemberRole } from "@/actions/admin";

export default async function AdminTeamPage() {
  await requireFounder();
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
                  {u.memberships.map((m) => `${m.team.name}${m.isLeader ? " (lead)" : ""}`).join(" · ") || "No team"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <form action={updateMemberRole} className="flex gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <select name="role" defaultValue={u.role} className="rounded-lg bg-ink px-2 py-1">
                    <option value="MEMBER">Member</option>
                    <option value="TEAM_ADMIN">Team admin</option>
                    <option value="FOUNDER">Founder</option>
                  </select>
                  <button className="underline">Save</button>
                </form>
                {u.role !== "FOUNDER" ? (
                  <form action={deactivateUser}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="text-coral">Deactivate</button>
                  </form>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {u.memberships.map((m) => (
                <form key={m.id} action={setTeamLeader}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="teamId" value={m.teamId} />
                  <input type="hidden" name="isLeader" value={m.isLeader ? "false" : "true"} />
                  <button className="rounded-full border border-white/15 px-3 py-1 text-xs">
                    {m.isLeader ? `Remove ${m.team.name} lead` : `Make ${m.team.name} lead`}
                  </button>
                </form>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-paper/40">{teams.length} teams in the org.</p>
    </div>
  );
}
