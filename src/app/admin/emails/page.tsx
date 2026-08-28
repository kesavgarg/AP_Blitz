import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export default async function EmailsPage() {
  await requireAdmin();
  const emails = await prisma.outgoingEmail.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Outgoing emails</h1>
      <p className="mt-2 text-sm text-paper/60">
        Every application confirmation, acceptance, and rejection is logged here so you can see
        whether it actually left the server.
      </p>
      <div className="mt-6 space-y-2">
        {emails.length === 0 ? (
          <p className="text-sm text-paper/50">No emails yet.</p>
        ) : (
          emails.map((e) => (
            <article key={e.id} className="rounded-2xl border border-white/10 bg-navy px-4 py-3 text-sm">
              <p>
                <span className="text-volt">{e.status}</span> → {e.to}
              </p>
              <p className="text-paper/70">{e.subject}</p>
              <p className="text-xs text-paper/40">{formatDateTime(e.createdAt)}</p>
              {e.error ? <p className="mt-1 text-xs text-coral">{e.error}</p> : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
