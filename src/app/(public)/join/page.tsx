import Link from "next/link";
import { APPLY_LANES } from "@/lib/roles";

export const metadata = { title: "Join the team" };

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Join the team</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl">
        Pick a lane. Show up. Ship AP content.
      </h1>
      <p className="mt-4 max-w-2xl text-paper/70">
        Three ways to start. One video is a single video. Video taker is every week. Graphic posts is the design work.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {APPLY_LANES.map((lane) => (
          <Link
            key={lane.id}
            href={`/apply?lane=${lane.id}`}
            className="rounded-[1.75rem] border border-white/10 bg-black/45 p-7 backdrop-blur-md transition hover:border-volt/40"
          >
            <span className="rounded-full bg-volt/15 px-3 py-1 text-xs text-volt">{lane.weekly}</span>
            <h2 className="mt-4 font-display text-3xl">{lane.name}</h2>
            <p className="mt-2 text-muted">{lane.description}</p>
            <p className="mt-6 font-semibold text-volt">Apply for this →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
