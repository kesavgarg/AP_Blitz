import Link from "next/link";
import { getOrgSettings } from "@/lib/settings";
import { ROLES } from "@/lib/roles";

export const metadata = { title: "About Us" };

export default async function AboutPage() {
  const settings = await getOrgSettings();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">About Us</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[0.95]">Students making AP content for other students.</h1>
      <p className="mt-5 max-w-2xl text-lg text-paper/75">{settings.brandTagline}</p>
      <p className="mt-4 max-w-2xl text-paper/70">{settings.founderBio}</p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["Watch", "Free review videos, sorted by the AP class they belong to."],
          ["Study", "Make a Blitzer account to save videos, pick your classes, and request topics."],
          ["Join the team", "Applying is separate. Kesav reviews those. A Blitzer login is not a job application."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-white/10 bg-black/45 p-6">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </div>

      <h2 className="mt-16 font-display text-4xl">Five ways to join the team</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role) => (
          <Link key={role.slug} href={`/join/${role.slug}`} className="rounded-3xl border border-white/10 bg-black/45 p-6 hover:border-volt/40">
            <span className="text-2xl">{role.emoji}</span>
            <h3 className="mt-3 font-display text-xl">{role.name}</h3>
            <p className="mt-2 text-sm text-muted">{role.tagline}</p>
          </Link>
        ))}
      </div>
      <Link href="/apply" className="mt-8 inline-flex rounded-full bg-volt px-6 py-3 font-semibold text-ink">
        Apply to the team
      </Link>
    </div>
  );
}
