import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireTeam } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { requestFullMembership } from "@/actions/one-time";
import { isOneTimeMember } from "@/lib/one-time";

export const dynamic = "force-dynamic";

export default async function CommitmentPage() {
  const user = await requireTeam();
  const oneTime = await isOneTimeMember(user.id, user.role);
  if (!oneTime && !isAdmin(user)) redirect("/workspace");

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-volt">Step 4</p>
      <h1 className="mt-2 font-display text-4xl text-ink">After the video is sent</h1>
      <div className="mt-6 grid gap-4">
        <section className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-ink">Log out and wait</h2>
          <p className="mt-2 text-sm text-ink/70">
            You are done. Wait for the video to be posted. You can come back here if you still need the steps.
          </p>
          <form action={logoutAction} className="mt-4">
            <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">Log out</button>
          </form>
        </section>
        <section className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-ink">Or join AP Blitz</h2>
          {oneTime?.joinRequestedAt ? (
            <p className="mt-2 text-sm text-ink/70">
              Kesav has your info. Refresh this page after he puts you on a team. Whichever team he picks is the one you will see.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink/70">
                This sends Kesav your name, email, phone, school, and AP classes. He picks the team. Then refresh, and you are on that team.
              </p>
              <form action={requestFullMembership} className="mt-4">
                <button className="rounded-full bg-volt px-5 py-3 text-sm font-semibold text-ink">
                  Email Kesav and ask to join
                </button>
              </form>
            </>
          )}
          <Link href="/workspace/about" className="mt-4 inline-block text-sm font-semibold text-volt">
            Back to the start
          </Link>
        </section>
      </div>
    </div>
  );
}
