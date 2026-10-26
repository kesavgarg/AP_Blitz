"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-navy p-6 text-paper">
      <h1 className="font-display text-3xl">Admin hit a snag.</h1>
      <p className="mt-2 text-sm text-paper/70">Try this page again.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">
        Try again
      </button>
    </div>
  );
}
