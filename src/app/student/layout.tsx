import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceNav, type NavItem } from "@/components/workspace/nav";
import { ViewAsBanner } from "@/components/view-as-banner";

export const dynamic = "force-dynamic";

const ITEMS: NavItem[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/videos", label: "Watch Videos", icon: "▶️" },
  { href: "/student/classes", label: "My AP Classes", icon: "📚" },
  { href: "/student/saved", label: "Saved Videos", icon: "⭐" },
  { href: "/student/requests", label: "Requests", icon: "🙋" },
  { href: "/student/feedback", label: "Feedback", icon: "💬" },
  { href: "/student/announcements", label: "Announcements", icon: "📣" },
  { href: "/student/notifications", label: "Notifications", icon: "🔔" },
  { href: "/student/profile", label: "Profile", icon: "🙂" },
  { href: "/student/apply", label: "Apply to Join", icon: "✍️" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role !== "BLITZER") redirect(user.role === "FOUNDER" ? "/admin" : "/workspace");
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  const items = ITEMS.map((item) =>
    item.href === "/student/notifications" ? { ...item, badge: unread || undefined, label: unread ? `Alerts (${unread})` : "Notifications" } : item,
  );
  return (
    <div className="flex min-h-screen flex-col bg-[#120f0c] text-paper">
      {user.viewingAs ? <ViewAsBanner name={`${user.firstName} ${user.lastName}`} /> : null}
      <div className="flex min-h-0 flex-1">
      <WorkspaceNav items={items} name={user.firstName} roleLabel="Blitzer" tone="dark" />
      <div className="flex min-w-0 flex-1 flex-col pb-28 md:pb-0">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 md:px-8">
          <p className="font-display text-lg">Blitzer</p>
          <Link href="/videos" className="rounded-full bg-volt px-3 py-1 text-sm font-semibold text-ink">Watch</Link>
        </header>
        <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
      </div>
      </div>
    </div>
  );
}
