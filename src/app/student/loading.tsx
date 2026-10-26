export default function StudentLoading() {
  return (
    <div className="text-paper" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">Loading</p>
      <div className="mt-4 h-10 w-56 animate-pulse rounded-2xl bg-white/10" />
      <div className="mt-6 h-40 animate-pulse rounded-3xl bg-white/10" />
    </div>
  );
}
