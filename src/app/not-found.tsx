export default function NotFound() {
  return (
    <div className="mesh grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-volt">404</p>
        <h1 className="mt-3 font-display text-5xl">This page isn&apos;t a thing.</h1>
        <p className="mt-3 text-paper/70">It may not exist, or you may not have access to it.</p>
        <a href="/" className="mt-8 inline-flex rounded-full bg-volt px-5 py-3 font-semibold text-ink">
          Back to AP Blitz
        </a>
      </div>
    </div>
  );
}
