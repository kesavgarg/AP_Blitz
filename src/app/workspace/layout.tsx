import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceNav, type NavItem } from "@/components/workspace/nav";
import { workspaceForTeam, canAccessChannel } from "@/lib/rbac";
import { AlertWatcher } from "@/components/workspace/alert-watcher";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
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

  const items: NavItem[] = [
    { href: "/workspace", label: "Home", icon: "🏠" },
    { href: "/workspace/messages", label: "Messages", icon: "💬", badge: unreadMessages || undefined },
    { href: "/workspace/calendar", label: "Calendar", icon: "📅" },
    { href: "/workspace/tasks", label: "My Tasks", icon: "✅" },
    { href: "/workspace/team", label: "My Team", icon: "👥" },
  ];

  const workspaces = user.role === "FOUNDER"
    ? [
        { href: "/workspace/social", label: "Social", icon: "📱" },
        { href: "/workspace/scripts", label: "Scripts", icon: "✍️" },
        { href: "/workspace/video", label: "Video", icon: "🎥" },
        { href: "/workspace/edit", label: "Edit", icon: "✂️" },
        { href: "/workspace/design", label: "Design", icon: "🎨" },
      ]
    : user.teams
        .filter((t) => t.key !== "SEO")
        .map((t) => ({
          href: workspaceForTeam(t.key),
          label: t.name.replace("AP ", "").split(" ")[0],
          icon: "🧩",
        }));

  items.push(...workspaces.filter((w, i, arr) => arr.findIndex((x) => x.href === w.href) === i));
  items.push(
    { href: "/workspace/daily-log", label: "Daily Log", icon: "📝" },
    { href: "/workspace/meetings", label: "Meetings", icon: "🎥" },
    { href: "/workspace/notifications", label: unread ? `Alerts (${unread})` : "Alerts", icon: "🔔", badge: unread || undefined },
    { href: "/workspace/profile", label: "Profile", icon: "🙂" },
  );
  if (user.role === "FOUNDER" || user.role === "TEAM_ADMIN") {
    items.push({ href: "/admin", label: "Admin", icon: "⚡" });
  }

  const roleLabel =
    user.role === "FOUNDER"
      ? "Founder"
      : user.role === "TEAM_ADMIN"
        ? "Team admin"
        : user.teams[0]?.name ?? "Member";

  return (
    <div className="flex min-h-screen bg-[#f3eee4] text-ink">
      <AlertWatcher baseTitle="AP Blitz" />
      <WorkspaceNav
        items={items}
        name={`${user.firstName} ${user.lastName}`}
        roleLabel={roleLabel}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white/80 px-4 backdrop-blur md:px-8">
          <p className="font-display text-lg md:hidden">
            <Image src="/logo-ap-blitz.png" alt="AP Blitz" width={48} height={48} className="h-12 w-12 object-contain" />
          </p>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/workspace/notifications" className="rounded-full bg-ink px-3 py-1 text-paper">
              {unread + unreadMessages ? `${unread + unreadMessages} new` : "Caught up"}
            </Link>
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
      </div>
    </div>
  );
}
