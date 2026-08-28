import { prisma } from "@/lib/prisma";
import { isFounder, requireUser } from "@/lib/auth";
import { getRoleByKey } from "@/lib/roles";

export default async function TeamPage() {
  const user = await requireUser();
  const teams = await prisma.team.findMany({
    include: {
      memberships: { include: { user: true } },
    },
    orderBy: { name: "asc" },
  });
  const visible = teams.filter((t) => isFounder(user) || user.teams.some((x) => x.key === t.key));

  return (
    <div>
      <h1 className="font-display text-4xl">My Team</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {visible.map((team) => (
          <section key={team.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-ink/40">
              {getRoleByKey(team.key)?.emoji} {team.name}
            </p>
            <p className="mt-1 text-sm text-ink/60">{team.description}</p>
            <ul className="mt-4 space-y-2">
              {team.memberships.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span>
                    {m.user.firstName} {m.user.lastName}
                  </span>
                  <span className="text-xs text-ink/40">
                    {m.isLeader ? "Lead" : m.user.role === "FOUNDER" ? "Founder" : "Member"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
