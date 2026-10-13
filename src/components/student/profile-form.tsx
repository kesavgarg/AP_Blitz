"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateBlitzerProfileAction } from "@/actions/student";
import type { ActionState } from "@/actions/auth";

export function ProfileForm({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [state, action, pending] = useActionState(updateBlitzerProfileAction, undefined as ActionState);
  return (
    <div className="max-w-lg">
      <h1 className="font-display text-4xl">Profile</h1>
      <form action={action} className="mt-6 space-y-3">
        {state?.error ? <p className="text-sm text-coral">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}
        <label className="block text-sm">First name
          <input name="firstName" required defaultValue={firstName} className="mt-1 w-full rounded-2xl bg-black/40 px-4 py-3" />
        </label>
        <label className="block text-sm">Last name
          <input name="lastName" required defaultValue={lastName} className="mt-1 w-full rounded-2xl bg-black/40 px-4 py-3" />
        </label>
        <button disabled={pending} className="rounded-full bg-volt px-5 py-2 font-semibold text-ink">
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      <Link href="/forgot-password" className="mt-6 inline-block text-sm text-volt">Reset password</Link>
    </div>
  );
}
