import Link from "next/link";
import { ROLES } from "@/lib/roles";

export const metadata = { title: "Join the team" };

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Join the team</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl">
        Pick a lane. Show up. Ship AP content.
      </h1>
      <p className="mt-4 max-w-2xl text-paper/70">
        Every role has its own page with expectations, example assignments, and
        an apply button. You&apos;ll choose a first and second choice on the form.
      </p>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {ROLES.map((role) => (
          <Link
            key={role.slug}
            href={`/join/${role.slug}`}
            className="rounded-[1.75rem] border border-white/10 bg-black/45 p-7 backdrop-blur-md transition hover:border-volt/40"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="text-3xl">{role.emoji}</span>
              <span className="rounded-full px-3 py-1 text-xs" style={{ background: `${role.accent}22`, color: role.accent }}>
                {role.weekly.split(",")[0]}
              </span>
            </div>
            <h2 className="mt-4 font-display text-3xl">{role.name}</h2>
            <p className="mt-2 text-muted">{role.description}</p>
            <p className="mt-6 font-semibold text-volt">Open role page →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
