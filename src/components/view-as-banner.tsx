import { stopViewingAs } from "@/actions/view-as";

export function ViewAsBanner({ name }: { name: string }) {
  return (
    <div className="border-b border-black/10 bg-volt px-4 py-2 text-sm text-ink">
      <form action={stopViewingAs} className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">You are seeing the site as {name}.</p>
        <button className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-paper">Back to my account</button>
      </form>
    </div>
  );
}
