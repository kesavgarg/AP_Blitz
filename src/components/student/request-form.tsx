"use client";

import { useActionState } from "react";
import { submitVideoRequestAction } from "@/actions/student";
import type { ActionState } from "@/actions/auth";

export function RequestForm({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(submitVideoRequestAction, undefined as ActionState);
  return (
    <form action={action} className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-5">
      {state?.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}
      <label className="block text-sm">AP subject
        <select name="subjectId" required className="mt-1 w-full rounded-2xl bg-ink px-3 py-3">
          <option value="">Choose</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
      </label>
      <label className="block text-sm">Unit or topic
        <input name="unit" required className="mt-1 w-full rounded-2xl bg-ink px-3 py-3" />
      </label>
      <label className="block text-sm">What do you want explained?
        <textarea name="prompt" required className="mt-1 min-h-28 w-full rounded-2xl bg-ink px-3 py-3" />
      </label>
      <label className="block text-sm">Optional details
        <textarea name="details" className="mt-1 min-h-20 w-full rounded-2xl bg-ink px-3 py-3" />
      </label>
      <button disabled={pending} className="rounded-full bg-volt px-5 py-2 font-semibold text-ink">
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
