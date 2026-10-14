import Link from "next/link";
import { requireTeam } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CommitmentPage() {
  await requireTeam();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl text-ink">Commitment</h1>
      <p className="mt-3 text-sm text-ink/70">
        You signed up to make one video. If you want to stay and make something every week, apply again as a full-time member.
        Kesav still has to accept that application.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link href="/apply?lane=video-taker" className="w-fit rounded-full bg-volt px-5 py-3 text-sm font-semibold text-ink">
          Apply again as a full-time video taker
        </Link>
        <Link href="/apply?lane=graphic-posts" className="text-sm font-semibold text-volt">
          Or apply for graphic posts
        </Link>
      </div>
    </div>
  );
}
