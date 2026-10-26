import { dismissGuide } from "@/actions/guides";
import { GuideVideo } from "@/components/workspace/guide-video";

export function GuidePlayer({
  fileId,
  title,
  body,
  waiting,
  firstVisit,
  which,
}: {
  fileId: string;
  title: string;
  body: string;
  waiting: string;
  firstVisit?: boolean;
  which?: "educational" | "promo";
}) {
  return (
    <div className="max-w-3xl text-[#f6f1e8]">
      <h1 className="font-display text-4xl">{title}</h1>
      {firstVisit ? (
        <p className="mt-3 rounded-3xl border border-white/15 bg-[#17171c] p-4 text-sm">
          Watch this before you start. This tab stays in your workspace, so you can watch it again later.
        </p>
      ) : null}
      <p className="mt-3 max-w-2xl text-sm text-white/75">{body}</p>
      {fileId ? (
        <GuideVideo fileId={fileId} />
      ) : (
        <p className="mt-6 rounded-3xl border border-white/15 bg-[#17171c] p-5 text-sm text-white/75">{waiting}</p>
      )}
      {firstVisit && which ? (
        <form action={dismissGuide} className="mt-4">
          <input type="hidden" name="which" value={which} />
          <button className="rounded-full bg-volt px-5 py-3 text-sm font-semibold text-ink">
            I&apos;ve watched it
          </button>
        </form>
      ) : null}
    </div>
  );
}
