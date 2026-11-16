import { ApplyForm } from "@/components/public/apply-form";
import { getApplyLane, type ApplyLaneId } from "@/lib/roles";

export const metadata = { title: "Apply" };

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ lane?: string }>;
}) {
  const { lane } = await searchParams;
  const match = getApplyLane(lane);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Application</p>
      <h1 className="mt-3 font-display text-5xl">Apply to AP Blitz</h1>
      <p className="mt-3 text-paper/70">
        {match
          ? `You're applying as ${match.name}. You can still switch before you submit.`
          : "Pick one video, video taker, or graphic posts."}{" "}
        Kesav reviews every application. You cannot log in until he accepts you.
      </p>
      <div className="mt-10">
        <ApplyForm defaultLane={match?.id as ApplyLaneId | undefined} />
      </div>
    </div>
  );
}
