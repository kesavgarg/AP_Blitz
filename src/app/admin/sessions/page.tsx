import { prisma } from "@/lib/prisma";
import { requireFounder } from "@/lib/auth";
import { revokeSessionAction } from "@/actions/admin";
import { formatDateTime } from "@/lib/utils";

export default async function SessionsPage() {
  await requireFounder();
  const sessions = await prisma.session.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-4xl">Sessions</h1>
      <p className="mt-2 max-w-2xl text-sm text-paper/60">
        Active sign-ins. Ending one signs that browser out. Password resets and role changes already end every session for that account.
      </p>
      <div className="mt-6 space-y-2">
        {sessions.length === 0 ? <p className="text-sm text-paper/50">No active sessions.</p> : null}
        {sessions.map((session) => (
          <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-navy px-4 py-3 text-sm">
            <div>
              <p className="font-medium">
                {session.user.firstName} {session.user.lastName}{" "}
                <span className="text-paper/50">{session.user.role}</span>
              </p>
              <p className="text-xs text-paper/50">{session.user.email}</p>
              <p className="mt-1 text-xs text-paper/40">
                {session.ip || "IP unknown"} · {session.userAgent || "Device unknown"} · {formatDateTime(session.createdAt)}
              </p>
            </div>
            <form action={revokeSessionAction}>
              <input type="hidden" name="id" value={session.id} />
              <button type="submit" className="rounded-full border border-white/15 px-3 py-1.5 text-xs">
                End session
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
