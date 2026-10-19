import { dismissGuide } from "@/actions/guides";

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
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-ink">{title}</h1>
      {firstVisit ? (
        <p className="mt-3 rounded-3xl bg-white p-4 text-sm text-ink">
          Watch this before you start. This tab stays in your workspace, so you can watch it again later.
        </p>
      ) : null}
      <p className="mt-3 max-w-2xl text-sm text-ink/70">{body}</p>
      {fileId ? (
        <video
          src={`/api/files/${fileId}`}
          controls
          playsInline
          className="mt-6 aspect-video w-full rounded-3xl bg-black"
        />
      ) : (
        <p className="mt-6 rounded-3xl bg-white p-5 text-sm text-ink/70">{waiting}</p>
      )}
      {firstVisit && which ? (
        <form action={dismissGuide} className="mt-4">
          <input type="hidden" name="which" value={which} />
          <button className="rounded-full bg-volt px-5 py-3 text-sm font-semibold text-ink">
            I've watched it
          </button>
        </form>
      ) : null}
    </div>
  );
}
