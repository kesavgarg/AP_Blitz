import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireTeam } from "@/lib/auth";
import { isOneTimeMember } from "@/lib/one-time";

export const dynamic = "force-dynamic";

export default async function OneVideoStepPage() {
  const user = await requireTeam();
  if (!(await isOneTimeMember(user.id, user.role)) && !isAdmin(user)) redirect("/workspace");

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-volt">Step 1</p>
      <h1 className="mt-2 font-display text-4xl text-ink">You are making a video that will be posted</h1>
      <div className="mt-5 space-y-3 text-sm text-ink/80">
        <p>This is one video. AP Blitz will post it.</p>
        <p>You do not write the idea, and you cannot edit the list. On the next page you pick one. Once you take it, it comes off the page so nobody else films the same one.</p>
        <p>Then you record it.</p>
      </div>
      <Link href="/workspace/trends" className="mt-6 inline-flex rounded-full bg-volt px-5 py-3 text-sm font-semibold text-ink">
        Step 2: pick the video
      </Link>
    </div>
  );
}
