import Link from "next/link";

export default function WorkspaceNotFound() {
  return (
    <div className="max-w-xl rounded-3xl border border-white/15 bg-[#17171c] p-6 text-[#f6f1e8]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">This screen</p>
      <h1 className="mt-2 font-display text-4xl">That page is not on this account.</h1>
      <p className="mt-3 text-sm text-white/70">
        It may belong to a different role. Open the overview, or use View as on the admin team page to see a member&apos;s screen.
      </p>
      <Link href="/workspace" className="mt-5 inline-flex rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink">
        Back to overview
      </Link>
    </div>
  );
}
