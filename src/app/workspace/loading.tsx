export default function WorkspaceLoading() {
  return (
    <div className="max-w-3xl text-[#f6f1e8]" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Loading</p>
      <div className="mt-4 h-10 w-64 animate-pulse rounded-2xl bg-white/10" />
      <div className="mt-6 h-48 animate-pulse rounded-3xl bg-white/10" />
    </div>
  );
}
