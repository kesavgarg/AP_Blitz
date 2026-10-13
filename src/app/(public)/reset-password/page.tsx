"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { resetPasswordAction } from "@/actions/account";
import type { ActionState } from "@/actions/auth";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [state, action, pending] = useActionState(resetPasswordAction, undefined as ActionState);
  return (
    <form action={action} className="mt-6 space-y-3">
      <input type="hidden" name="token" value={token} />
      {state?.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      <label className="block text-sm">New password
        <input name="password" type="password" required className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" />
      </label>
      <label className="block text-sm">Confirm
        <input name="confirm" type="password" required className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" />
      </label>
      <button disabled={pending} className="w-full rounded-full bg-volt py-3 font-semibold text-ink">
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 pb-20">
      <h1 className="font-display text-4xl">Choose a new password</h1>
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
