"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/actions/account";
import type { ActionState } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined as ActionState);
  return (
    <div className="mx-auto max-w-md px-4 pb-20">
      <h1 className="font-display text-4xl">Reset your password</h1>
      <form action={action} className="mt-6 space-y-3">
        {state?.error ? <p className="text-sm text-coral">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-paper/80">{state.success}</p> : null}
        <label className="block text-sm">Email
          <input name="email" type="email" required className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" />
        </label>
        <button disabled={pending} className="w-full rounded-full bg-volt py-3 font-semibold text-ink">
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <Link href="/login" className="mt-4 inline-block text-sm text-volt">Back to log in</Link>
    </div>
  );
}
