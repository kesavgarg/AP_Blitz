import { prisma } from "@/lib/prisma";
import { isFounder, requireUser } from "@/lib/auth";
import { getRoleByKey, isActiveTeamKey } from "@/lib/roles";
import { Avatar } from "@/components/workspace/avatar";
import { openDirectMessage } from "@/actions/messages";
import { SubmitButton } from "@/components/ui/submit-button";
import Link from "next/link";

export default async function TeamPage() {
  const user = await requireUser();
  const teams = await prisma.team.findMany({
    include: {
      memberships: { include: { user: true } },
    },
    orderBy: { name: "asc" },
  });
  const visible = teams.filter(
    (t) => isActiveTeamKey(t.key) && (isFounder(user) || user.teams.some((x) => x.key === t.key)),
  );

  return (
    <div>
      <h1 className="font-display text-4xl">My Team</h1>
      <p className="mt-2 text-sm text-ink/60">
        Add your photo and a short bio in{" "}
        <Link href="/workspace/profile" className="underline">
          Profile
        </Link>
        .
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {visible.map((team) => (
          <section key={team.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-ink/40">
              {getRoleByKey(team.key)?.emoji} {team.name}
            </p>
            <p className="mt-1 text-sm text-ink/60">{team.description}</p>
            <ul className="mt-4 space-y-4">
              {team.memberships.map((m) => (
                <li key={m.id} className="flex gap-3">
                  <Avatar user={m.user} size={48} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {m.user.firstName} {m.user.lastName}{" "}
                      <span className="text-xs font-normal text-ink/40">
                        {m.isLeader ? "Lead" : m.user.role === "FOUNDER" ? "Founder" : "Member"}
                      </span>
                    </p>
                    <p className="text-xs text-ink/50">{m.user.bio || "No bio yet."}</p>
                    {m.user.id !== user.id ? (
                      <form action={openDirectMessage} className="mt-1">
                        <input type="hidden" name="userId" value={m.user.id} />
                        <SubmitButton className="text-xs underline" pendingLabel="Opening…">
                          Message
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
