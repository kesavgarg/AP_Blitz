"use client";

import { useActionState } from "react";
import { setupAccountAction, type ActionState } from "@/actions/auth";

export function SetupForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    setupAccountAction,
    undefined as ActionState,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.error ? (
        <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm">
        New password
        <input
          name="password"
          type="password"
          required
          minLength={10}
          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 outline-none focus:border-volt/40"
        />
      </label>
      <label className="block text-sm">
        Confirm password
        <input
          name="confirm"
          type="password"
          required
          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 outline-none focus:border-volt/40"
        />
      </label>
      <p className="text-xs text-muted">At least 10 characters, with a letter and a number.</p>
      <button
        disabled={pending}
        className="w-full rounded-full bg-volt py-3 font-semibold text-ink disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create account"}
      </button>
    </form>
  );
}
