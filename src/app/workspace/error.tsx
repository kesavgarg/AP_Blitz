"use client";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-xl rounded-3xl border border-white/15 bg-[#17171c] p-6 text-[#f6f1e8]">
      <h1 className="font-display text-3xl">This screen hit a snag.</h1>
      <p className="mt-2 text-sm text-white/70">The rest of AP Blitz is still there. Try this page again.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">
        Try again
      </button>
    </div>
  );
}
