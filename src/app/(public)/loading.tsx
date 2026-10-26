export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-paper" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-volt">AP Blitz</p>
      <div className="mt-4 h-16 w-2/3 max-w-xl animate-pulse rounded-2xl bg-white/10" />
      <div className="mt-8 h-12 w-48 animate-pulse rounded-full bg-volt/50" />
    </div>
  );
}
