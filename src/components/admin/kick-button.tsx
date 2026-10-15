"use client";

import { kickMember, removeMemberFromTeam } from "@/actions/admin";

export function KickButton({ userId, name }: { userId: string; name: string }) {
  return (
    <form
      action={kickMember}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Remove ${name} from AP Blitz? Their account is deleted from the database. They have to apply again, and login will say no account found.`,
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button className="text-coral">Remove from AP Blitz</button>
    </form>
  );
}

export function RemoveRoleButton({
  userId,
  teamId,
  teamName,
  name,
  onlyRole,
}: {
  userId: string;
  teamId: string;
  teamName: string;
  name: string;
  onlyRole: boolean;
}) {
  return (
    <form
      action={removeMemberFromTeam}
      onSubmit={(event) => {
        const ok = window.confirm(
          onlyRole
            ? `Remove ${name} from ${teamName}? This is their last role, so their account is deleted and they have to apply again.`
            : `Remove ${name} from ${teamName}? Their other roles stay.`,
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="teamId" value={teamId} />
      <button className="rounded-full border border-coral/40 px-3 py-1 text-xs text-coral">
        {onlyRole ? "Remove from AP Blitz" : `Remove ${teamName}`}
      </button>
    </form>
  );
}
