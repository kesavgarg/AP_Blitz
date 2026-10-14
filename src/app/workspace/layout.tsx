import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth";
import { isOneTimeMember, oneTimePathAllowed } from "@/lib/one-time";
import { prisma } from "@/lib/prisma";
import { WorkspaceNav, type NavItem } from "@/components/workspace/nav";
import { canAccessChannel } from "@/lib/rbac";
import { AlertWatcher } from "@/components/workspace/alert-watcher";
import { ThemeToggle } from "@/components/workspace/theme-toggle";
import { OneTimeGate } from "@/components/workspace/one-time-gate";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role === "BLITZER") redirect("/student/dashboard");
  const oneTime = await isOneTimeMember(user.id, user.role);
  const pathname = (await headers()).get("x-pathname") || "";
  if (oneTime && pathname.startsWith("/workspace") && !oneTimePathAllowed(pathname)) {
    redirect("/workspace/trends");
  }
  const channels = await prisma.messageChannel.findMany({
    include: { members: { select: { userId: true } } },
  });
  const accessibleIds = channels.filter((c) => canAccessChannel(user, c)).map((c) => c.id);
  const [unread, unreadMessages] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
    accessibleIds.length
      ? prisma.message.count({
          where: {
            channelId: { in: accessibleIds },
            deletedAt: null,
            authorId: { not: user.id },
            reads: { none: { userId: user.id } },
          },
        })
      : Promise.resolve(0),
  ]);

  const items: NavItem[] = [];
  if (oneTime) {
    items.push(
      { href: "/workspace/trends", label: "Video ideas", icon: "📈" },
      { href: "/workspace/kesav", label: "Message Kesav", icon: "💬" },
      { href: "/workspace/commitment", label: "Commitment", icon: "✅" },
    );
  } else {
  if (isAdmin(user)) {
    items.push({ href: "/admin", label: "Admin", icon: "🛠️" });
  }
  items.push(
    { href: "/workspace", label: "Overview", icon: "🏠" },
    { href: "/workspace/messages", label: "Messages", icon: "💬", badge: unreadMessages || undefined },
    { href: "/workspace/tasks", label: "My Tasks", icon: "✅" },
    { href: "/workspace/calendar", label: "Calendar", icon: "📅" },
    { href: "/workspace/pipeline", label: "Content Pipeline", icon: "🎬" },
    { href: "/workspace/videos", label: "Videos", icon: "▶️" },
    { href: "/workspace/trends", label: "Trends", icon: "📈" },
  );
  if (user.role === "FOUNDER" || user.role === "TEAM_ADMIN") {
    items.push({ href: "/admin/applications", label: "Applications", icon: "📥" });
  }
  items.push(
    { href: "/workspace/completed", label: "Completed Work", icon: "📦" },
    { href: "/workspace/daily-log", label: "Daily Logs", icon: "📝" },
    { href: "/workspace/meetings", label: "Meetings", icon: "🗓️" },
    { href: "/workspace/announcements", label: "Announcements", icon: "📣" },
    { href: "/workspace/notifications", label: unread ? `Alerts (${unread})` : "Notifications", icon: "🔔", badge: unread || undefined },
    { href: "/workspace/profile", label: "Profile", icon: "🙂" },
  );
  if (user.role === "FOUNDER") {
    items.push({ href: "/admin/settings", label: "Settings", icon: "⚙️" });
  }
  }

  const roleLabel = oneTime
    ? "One video"
    :
    user.role === "FOUNDER"
      ? "Founder"
      : user.role === "TEAM_ADMIN"
        ? "Team admin"
        : user.teams[0]?.name ?? "Member";

  return (
    <div id="workspace-root" className="ws-dark flex min-h-screen bg-[#0c0c10] text-[#f6f1e8]">
      <AlertWatcher baseTitle="AP Blitz" />
      <WorkspaceNav
        items={items}
        name={`${user.firstName} ${user.lastName}`}
        roleLabel={roleLabel}
        tone="dark"
      />
      <div className="flex min-w-0 flex-1 flex-col pb-28 md:pb-0">
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-black/50 px-4 backdrop-blur md:px-8">
          <p className="font-display text-lg md:hidden">
            <Image src="/logo-ap-blitz.png" alt="AP Blitz" width={48} height={48} className="h-12 w-12 object-contain" />
          </p>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <ThemeToggle />
            {oneTime ? null : (
            <Link href="/workspace/notifications" className="rounded-full bg-ink px-3 py-1 text-paper">
              {unread + unreadMessages ? `${unread + unreadMessages} new` : "Caught up"}
            </Link>
            )}
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-8">
          <OneTimeGate active={Boolean(oneTime)}>{children}</OneTimeGate>
        </div>
      </div>
    </div>
  );
}
