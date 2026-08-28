import Link from "next/link";
import { getOrgSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { VideoEmbed } from "@/components/public/video-embed";

export default async function HomePage() {
  const [settings, user] = await Promise.all([getOrgSettings(), getSessionUser()]);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-28">
          <p className="inline-flex rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-volt">
            Student-run · AP content org
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            For Students,{" "}
            <span className="text-volt">By Students.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-paper/75">
            {settings.brandTagline} We write scripts, film videos, edit, design,
            and post — then we run the whole thing like a real team.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/join"
              className="rounded-full bg-volt px-6 py-3 text-center font-semibold text-ink"
            >
              See the roles
            </Link>
            {user ? (
              <Link
                href="/workspace"
                className="rounded-full border border-white/15 px-6 py-3 text-center font-semibold"
              >
                Open workspace
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-6 py-3 text-center font-semibold"
              >
                Team login
              </Link>
            )}
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-3">
        {[
          {
            t: "Not another study site",
            d: "We're an organization. Students join a team, get assignments, hit deadlines, and ship content.",
          },
          {
            t: "Built around a pipeline",
            d: "Idea → script → film → edit → graphics → SEO → publish. Everyone has a lane.",
          },
          {
            t: "You can actually join",
            d: "Six roles. Apply once. If you're in, you get a workspace — not just a Discord ping.",
          },
        ].map((c) => (
          <div key={c.t} className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md">
            <h2 className="font-display text-2xl">{c.t}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{c.d}</p>
          </div>
        ))}
      </section>

      <section id="video" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <VideoEmbed url={settings.founderVideoUrl} type={settings.founderVideoType} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">
              From the founder
            </p>
            <h2 className="mt-3 font-display text-4xl">
              Meet {settings.founderName}
            </h2>
            <p className="mt-2 text-sm text-volt">{settings.founderTitle} of AP Blitz</p>
            <p className="mt-4 text-paper/75">{settings.founderBio}</p>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              <li>• What AP Blitz is — and why it exists</li>
              <li>• How the teams actually work</li>
              <li>• What each role does after you join</li>
              <li>• What we expect besides “being in the chat”</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">
              The roster
            </p>
            <h2 className="mt-2 font-display text-4xl">Six ways to join</h2>
          </div>
          <Link href="/join" className="hidden text-sm text-volt md:inline">
            View all roles →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => (
            <Link
              key={role.slug}
              href={`/join/${role.slug}`}
              className="group rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-volt/40"
            >
              <span className="text-2xl">{role.emoji}</span>
              <h3 className="mt-3 font-display text-xl">{role.name}</h3>
              <p className="mt-2 text-sm text-muted">{role.tagline}</p>
              <p className="mt-4 text-sm font-semibold" style={{ color: role.accent }}>
                Apply for this position →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="rounded-[2rem] border border-white/10 bg-black/45 p-8 backdrop-blur-md md:p-12">
          <h2 className="font-display text-4xl">How AP Blitz actually runs</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ["01", "Apply", "Pick a role, fill the form, wait for review."],
              ["02", "Get in", "If you're accepted, we email a temporary password. Log in — don't apply again."],
              ["03", "Work", "Messages, tasks, calendar, your role workspace."],
              ["04", "Ship", "Content moves through the pipeline and goes live."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-volt">{n}</p>
                <p className="mt-1 font-display text-xl">{t}</p>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="inline-flex rounded-full bg-volt px-6 py-3 font-semibold text-ink"
            >
              Apply to AP Blitz
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-full border border-white/20 px-6 py-3 font-semibold"
            >
              Already accepted? Log in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
