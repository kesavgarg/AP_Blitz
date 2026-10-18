import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireTeam } from "@/lib/auth";
import { isOneTimeMember } from "@/lib/one-time";

export const dynamic = "force-dynamic";

export default async function AboutBlitzPage() {
  const user = await requireTeam();
  if (!(await isOneTimeMember(user.id, user.role)) && !isAdmin(user)) redirect("/workspace");

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-volt">Start here</p>
      <h1 className="mt-2 font-display text-4xl text-ink">What AP Blitz is</h1>
      <div className="mt-5 space-y-3 text-sm text-ink/80">
        <p>AP Blitz is student-run AP content. Students make the videos and the graphics, for other students who are studying.</p>
        <p>You are here to make one video. It will be posted. You pick which one on the next pages, record it, and send it to Kesav.</p>
        <p>This is not a weekly job yet. After the video is in, you can log out and wait, or ask to join the team.</p>
      </div>
      <Link href="/workspace/one-video" className="mt-6 inline-flex rounded-full bg-volt px-5 py-3 text-sm font-semibold text-ink">
        Next: the video you are making
      </Link>
    </div>
  );
}
