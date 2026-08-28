"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "@/actions/logs";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    undefined as PasswordState,
  );

  return (
    <form action={action} className="mt-4 space-y-3">
      {state?.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <label className="block text-sm">
        Current / temporary password
        <input
          name="currentPassword"
          type="password"
          required
          className="mt-1 w-full rounded-xl border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        New password
        <input
          name="newPassword"
          type="password"
          required
          minLength={10}
          className="mt-1 w-full rounded-xl border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Confirm new password
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          className="mt-1 w-full rounded-xl border px-3 py-2"
        />
      </label>
      <button
        disabled={pending}
        className="rounded-full bg-ink px-4 py-2 text-paper disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
