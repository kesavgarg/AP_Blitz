import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFounder, requireUser } from "@/lib/auth";
import { deleteScript, publishScript, saveScript } from "@/actions/content";
import { AP_SUBJECTS } from "@/lib/ap-subjects";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

export default async function ScriptsWorkspace({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; subject?: string; error?: string }>;
}) {
  const user = await requireUser();
  if (!isFounder(user)) notFound();
  const { id, subject, error } = await searchParams;
  const scripts = await prisma.script.findMany({
    include: { contentItem: { include: { video: true } }, author: true },
    orderBy: { updatedAt: "desc" },
  });
  const subjects = Array.from(
    new Set(scripts.map((s) => s.apSubject).filter((s): s is string => Boolean(s))),
  ).sort();
  const filtered = subject ? scripts.filter((s) => (s.apSubject || "Unsorted") === subject) : scripts;
  const active = filtered.find((s) => s.id === id) ?? filtered[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-3xl bg-white p-3 shadow-sm">
        <h1 className="px-2 font-display text-xl">Scripts</h1>
        <p className="mt-1 px-2 text-xs text-ink/50">
          Only you can make or delete a script. Publish it, and an educational video maker can accept it.
        </p>
        <div className="mt-3 flex flex-wrap gap-1 px-1">
          <FilterChip href="/workspace/scripts" active={!subject} label="All" />
          {subjects.map((s) => (
            <FilterChip
              key={s}
              href={`/workspace/scripts?subject=${encodeURIComponent(s)}`}
              active={subject === s}
              label={s.replace(/^AP /, "")}
            />
          ))}
          {scripts.some((s) => !s.apSubject) ? (
            <FilterChip
              href="/workspace/scripts?subject=Unsorted"
              active={subject === "Unsorted"}
              label="Unsorted"
            />
          ) : null}
        </div>
        <form action={saveScript} className="mt-3 space-y-2 px-2">
          <input type="hidden" name="title" value="Untitled script" />
          <input type="hidden" name="body" value="" />
          <select
            name="apSubject"
            defaultValue={subject && subject !== "Unsorted" ? subject : ""}
            className="w-full rounded-xl border px-2 py-1.5 text-xs"
          >
            <option value="">AP subject</option>
            {AP_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <SubmitButton className="w-full rounded-xl bg-ink py-2 text-sm text-paper" pendingLabel="Creating…">
            New script
          </SubmitButton>
        </form>
        <div className="mt-3 space-y-1">
          {filtered.length === 0 ? (
            <p className="px-2 text-xs text-ink/40">No scripts in this subject yet.</p>
          ) : (
            filtered.map((s) => (
              <Link
                key={s.id}
                href={`/workspace/scripts?id=${s.id}${s.apSubject ? `&subject=${encodeURIComponent(s.apSubject)}` : ""}`}
                className={`block rounded-xl px-3 py-2 text-sm ${s.id === active?.id ? "bg-ink text-paper ring-2 ring-volt" : "hover:bg-black/5"}`}
              >
                <p className="truncate font-medium">{s.title || "Untitled"}</p>
                <p className="text-[10px] opacity-70">
                  {s.apSubject ? `${s.apSubject} · ` : ""}
                  {String(s.status ?? "DRAFT").replaceAll("_", " ")}
                </p>
              </Link>
            ))
          )}
        </div>
      </aside>
      {active ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-ink/40">
            Editing this script only · {active.apSubject || "No AP subject yet"}
          </p>
          {error ? (
            <p className="mt-3 rounded-2xl bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
          ) : null}
          <form key={active.id} action={saveScript} className="mt-2 space-y-3">
            <input type="hidden" name="id" value={active.id} />
            <input
              name="title"
              defaultValue={active.title}
              placeholder="Script title"
              className="w-full border-none font-display text-3xl outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <select
                name="apSubject"
                defaultValue={active.apSubject ?? ""}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                <option value="">AP subject</option>
                {AP_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                name="apUnit"
                defaultValue={active.apUnit ?? ""}
                placeholder="Unit / topic"
                className="rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="body"
              defaultValue={active.body}
              rows={18}
              className="w-full rounded-2xl border px-4 py-3 font-sans text-sm leading-7"
              placeholder={"HOOK:\n\nPOINT 1:\n\nPOINT 2:\n\nOUTRO:"}
            />
            <SubmitButton className="rounded-full border px-4 py-2 text-sm" pendingLabel="Saving…">
              Save this script
            </SubmitButton>
          </form>
          {active.status === "ASSIGNED" ? (
            <p className="mt-4 text-sm text-ink/60">Someone already accepted this. It is off the open list.</p>
          ) : active.status === "APPROVED" ? (
            <p className="mt-4 text-sm text-ink/60">Published. An educational video maker can accept it.</p>
          ) : (
            <form action={publishScript} className="mt-4">
              <input type="hidden" name="id" value={active.id} />
              <SubmitButton className="rounded-full bg-ink px-4 py-2 text-sm text-paper" pendingLabel="Publishing…">
                Publish
              </SubmitButton>
            </form>
          )}
          <form action={deleteScript} className="mt-3">
            <input type="hidden" name="id" value={active.id} />
            <SubmitButton
              className="rounded-full border border-coral/40 px-4 py-2 text-sm text-coral"
              pendingLabel="Deleting…"
            >
              Delete this script
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 text-sm text-ink/60 shadow-sm">
          {error ? <p className="mb-3 text-coral">{error}</p> : null}
          Create a script and pick an AP subject so it stays in its own pile.
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-2.5 py-1 text-[11px] ${active ? "bg-ink text-paper" : "bg-black/5 text-ink/70"}`}
    >
      {label}
    </Link>
  );
}
