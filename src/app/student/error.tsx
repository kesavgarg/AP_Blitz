"use client";

export default function StudentError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-xl rounded-3xl border border-white/15 bg-[#17171c] p-6 text-paper">
      <h1 className="font-display text-3xl">This screen hit a snag.</h1>
      <button type="button" onClick={reset} className="mt-5 rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">
        Try again
      </button>
    </div>
  );
}
