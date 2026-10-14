"use client";

import { kickMember } from "@/actions/admin";

export function KickButton({ userId, name }: { userId: string; name: string }) {
  return (
    <form
      action={kickMember}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Kick ${name} off AP Blitz? Their account is deleted. They have to sign up again, and login will say no account found.`,
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button className="text-coral">Kick off AP Blitz</button>
    </form>
  );
}
