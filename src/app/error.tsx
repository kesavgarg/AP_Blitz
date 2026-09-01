"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mesh grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-volt">Something broke</p>
        <h1 className="mt-3 font-display text-5xl">This page hit an error.</h1>
        <p className="mt-3 text-paper/70">Refresh, or go back to the home page and try again.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex rounded-full bg-volt px-5 py-3 font-semibold text-ink"
          >
            Try again
          </button>
          <a href="/" className="inline-flex rounded-full border border-white/20 px-5 py-3 font-semibold">
            Back to AP Blitz
          </a>
        </div>
      </div>
    </div>
  );
}
