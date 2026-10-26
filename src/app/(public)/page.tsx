import Link from "next/link";
import { getOrgSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";
import { ClipEmbed, VideoEmbed } from "@/components/public/video-embed";
import { SubjectCard } from "@/components/public/subject-card";
import { SUBJECT_LOGOS } from "@/lib/subjects";
import { listSubjects } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [settings, user, clips, subjects] = await Promise.all([
    getOrgSettings(),
    getSessionUser(),
    prisma.showcaseClip.findMany({ orderBy: { sortOrder: "asc" } }),
    listSubjects(),
  ]);
  const accountHref = !user
    ? "/login"
    : user.role === "BLITZER"
      ? "/student/dashboard"
      : user.role === "FOUNDER"
        ? "/admin"
        : "/workspace";
  const offered = subjects.filter((subject) => subject.videoCount > 0);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-[#F0A202]/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-[#6272A8]/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#E07A6F]/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-6 md:pb-20 md:pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-volt">Welcome to AP Blitz</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold leading-[0.92] tracking-tight md:text-7xl">
            Your AP classes.
            <span className="block text-paper/90">Explained by students, for students.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/75">
            AP Blitz makes AP review videos and resources so you can understand the hard parts,
            prep for the exam, and study faster than rereading the textbook.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:max-w-xl">
            <Link href="/videos" className="rounded-full bg-volt px-6 py-4 text-center text-lg font-semibold text-ink">
              Watch Videos
            </Link>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link href="/join" className="rounded-full border border-white/15 px-4 py-3 text-center text-sm font-semibold">
                Apply to Join
              </Link>
              <Link href={user ? accountHref : "/login"} className="rounded-full border border-white/15 px-4 py-3 text-center text-sm font-semibold">
                {user ? "My account" : "Log In"}
              </Link>
              <Link href="/about" className="rounded-full border border-white/15 px-4 py-3 text-center text-sm font-semibold">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Subjects with videos</p>
            <h2 className="mt-2 font-display text-4xl">Jump into a class</h2>
          </div>
          <Link href="/videos" className="text-sm font-semibold text-volt">
            Full library
          </Link>
        </div>
        {offered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offered.slice(0, 6).map((subject) => (
              <SubjectCard
                key={subject.id}
                href={`/videos/${subject.slug}`}
                name={subject.name}
                color={subject.color}
                ink={subject.ink}
                icon={subject.icon}
                count={subject.videoCount}
                logo={SUBJECT_LOGOS[subject.slug]}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-black/40 p-8 text-sm text-muted">
            Published videos will show up here automatically, sorted by the AP subject saved on each video.
          </div>
        )}
      </section>

      <section id="video" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <VideoEmbed url={settings.founderVideoUrl} type={settings.founderVideoType} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">From the founder</p>
            <h2 className="mt-3 font-display text-4xl">Meet {settings.founderName}</h2>
            <p className="mt-2 text-sm text-volt">{settings.founderTitle} of AP Blitz</p>
            <p className="mt-4 text-paper/75">{settings.founderBio}</p>
          </div>
        </div>
      </section>

      <section id="examples" className="mx-auto max-w-6xl px-4 pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Examples</p>
        <h2 className="mt-2 font-display text-4xl">What we actually post</h2>
        {clips.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clips.map((clip) => (
              <div key={clip.id}>
                <ClipEmbed url={clip.url} title={clip.title} />
                <p className="mt-2 text-sm text-paper/80">{clip.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-black/40 p-8 text-sm text-muted">
            Reels land here once an admin pastes Instagram links in Settings.
          </div>
        )}
      </section>
    </div>
  );
}
