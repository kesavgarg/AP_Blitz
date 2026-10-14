import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { APPLY_LANES } from "@/lib/roles";
import { getOrgSettings } from "@/lib/settings";

export const metadata = { title: "Join" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const settings = await getOrgSettings();
  const blitzer = tab !== "apply";
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <h1 className="font-display text-5xl leading-none">How do you want to join?</h1>
      <p className="mt-3 text-paper/70">These are two different things. A study account is not a team application.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/register" className={`rounded-3xl border p-5 ${blitzer ? "border-volt bg-volt/10" : "border-white/10"}`}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">Option 1</p>
          <h2 className="mt-2 font-display text-3xl">Become a Blitzer</h2>
          <p className="mt-2 text-sm text-paper/70">Watch videos, pick your AP classes, save favorites, send requests and feedback. No approval.</p>
        </Link>
        <Link href="/join" className="rounded-3xl border border-white/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">Option 2</p>
          <h2 className="mt-2 font-display text-3xl">Apply to Join AP Blitz</h2>
          <p className="mt-2 text-sm text-paper/70">Work on the team. Kesav reviews this. It does not turn a Blitzer account into a member by itself.</p>
        </Link>
      </div>
      <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-black/45 p-6">
        {blitzer ? (
          <>
            <h2 className="font-display text-3xl">Create a Blitzer account</h2>
            <p className="mt-2 text-sm text-muted">Use at least 10 characters, with a letter and a number.</p>
            <div className="mt-5">
              <RegisterForm instagramUrl={settings.instagramUrl || undefined} />
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-3xl">Team application</h2>
            <p className="mt-2 text-sm text-paper/70">
              This opens the existing application. Casual signups never show up in that review queue.
            </p>
            <Link href="/apply" className="mt-6 inline-flex rounded-full bg-volt px-5 py-3 font-semibold text-ink">
              Continue to the application
            </Link>
            <div className="mt-8 grid gap-4">
              {APPLY_LANES.map((lane) => (
                <article key={lane.id} className="rounded-3xl border border-white/10 p-5">
                  <h3 className="font-display text-2xl">{lane.name}</h3>
                  <p className="mt-2 text-sm text-paper/70">{lane.description}</p>
                  <p className="mt-2 text-sm text-muted">{lane.weekly}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
