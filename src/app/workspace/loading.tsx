export default function WorkspaceLoading() {
  return (
    <div className="max-w-3xl text-[#f6f1e8]" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">You're in</p>
      <h1 className="mt-3 font-display text-4xl">Opening your workspace</h1>
      <p className="mt-2 max-w-xl text-sm text-white/75">
        Calendar, messages, and tasks are loading. You can stay on this page.
      </p>
      <div className="mt-6 h-36 animate-pulse rounded-3xl bg-white/10" />
    </div>
  );
}
