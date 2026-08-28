"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined as ActionState);
  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state?.error ? (
        <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 outline-none focus:border-volt/40"
        />
      </label>
      <label className="block text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 outline-none focus:border-volt/40"
        />
      </label>
      <button
        disabled={pending}
        className="w-full rounded-full bg-volt py-3 font-semibold text-ink disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
