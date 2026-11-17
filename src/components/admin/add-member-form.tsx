"use client";

import { useActionState, useEffect, useRef } from "react";
import { createMemberDirectly, type CreateMemberState } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";

const field = "mt-1 w-full rounded-lg bg-ink px-3 py-2 text-sm";

export function AddMemberForm({ roles }: { roles: Array<{ key: string; shortName: string }> }) {
  const [state, action] = useActionState(createMemberDirectly, undefined as CreateMemberState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.added) formRef.current?.reset();
  }, [state]);

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-navy p-5">
      <h2 className="font-display text-2xl">Add someone to the team</h2>
      <p className="mt-1 text-sm text-paper/50">They skip the application and log in with the password you set here.</p>
      <form ref={formRef} action={action} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">First name<input name="firstName" required className={field} /></label>
        <label className="text-sm">Last name<input name="lastName" required className={field} /></label>
        <label className="text-sm">Email<input name="email" type="email" required className={field} /></label>
        <label className="text-sm">Phone<input name="phone" type="tel" required className={field} /></label>
        <label className="text-sm">Password<input name="password" type="text" required minLength={8} autoComplete="off" className={field} /></label>
        <label className="text-sm">
          Role
          <select name="teamKey" required className={field}>
            {roles.map((r) => (
              <option key={r.key} value={r.key}>{r.shortName}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <SubmitButton className="rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink" pendingLabel="Adding…">
            Add to team
          </SubmitButton>
          {state?.error ? <p className="text-sm text-coral">{state.error}</p> : null}
          {state?.added ? <p className="text-sm text-volt">{state.added}</p> : null}
        </div>
      </form>
    </section>
  );
}
