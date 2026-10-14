import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { BrandMark } from "@/components/brand";
import { getOrgSettings } from "@/lib/settings";
import { AlertWatcher } from "@/components/workspace/alert-watcher";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/team", label: "Team" },
  { href: "/workspace/videos", label: "Videos" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/workspace/announcements", label: "Announcements" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/workspace", label: "Workspace" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const settings = await getOrgSettings();
  const emailReady = Boolean(settings.smtpHost && settings.smtpUser && settings.smtpPass);
  return (
    <div className="mesh min-h-screen text-paper">
      <AlertWatcher baseTitle="Admin · AP Blitz" />
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 py-2">
          <BrandMark />
          <Link href="/admin" className="shrink-0 font-display text-sm text-volt">
            Admin
          </Link>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap text-sm text-paper/70 hover:text-volt">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      {!emailReady ? (
        <div className="border-b border-coral/30 bg-coral/15 px-4 py-3 text-sm">
          <div className="mx-auto max-w-6xl">
            Accept/reject emails will not reach inboxes until you add a Gmail App Password in{" "}
            <Link href="/admin/settings" className="font-semibold text-volt underline">
              Settings
            </Link>
            . You can still accept people and copy the temporary password from the application
            page.
          </div>
        </div>
      ) : null}
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
