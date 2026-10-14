"use client";

import { useActionState } from "react";
import { registerBlitzerAction } from "@/actions/account";
import type { ActionState } from "@/actions/auth";

export function RegisterForm({ instagramUrl }: { instagramUrl?: string }) {
  const [state, action, pending] = useActionState(registerBlitzerAction, undefined as ActionState);
  return (
    <form action={action} className="space-y-3">
      {state?.error ? <p className="rounded-2xl bg-coral/15 px-4 py-3 text-sm text-coral">{state.error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">First name
          <input name="firstName" required className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" />
        </label>
        <label className="text-sm">Last name
          <input name="lastName" required className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" />
        </label>
      </div>
      <label className="block text-sm">Email
        <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" />
      </label>
      <label className="block text-sm">Password
        <input name="password" type="password" required autoComplete="new-password" className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" />
      </label>
      <label className="block text-sm">Confirm password
        <input name="confirm" type="password" required className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" />
      </label>
      <fieldset className="rounded-2xl border border-volt/40 bg-volt/10 p-4">
        <legend className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-volt">Follow AP Blitz on Instagram</legend>
        <p className="mt-2 text-sm">Do you follow AP Blitz on Instagram?</p>
        {instagramUrl ? (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink"
          >
            Follow on Instagram
          </a>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-ink px-4 py-3 text-sm">
            <input type="radio" name="followsInstagram" value="yes" required />
            Yes, I follow
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-ink px-4 py-3 text-sm">
            <input type="radio" name="followsInstagram" value="no" />
            Not yet
          </label>
        </div>
      </fieldset>
      <button disabled={pending} className="w-full rounded-full bg-volt py-3 font-semibold text-ink">
        {pending ? "Creating your account…" : "Create Blitzer account"}
      </button>
    </form>
  );
}
