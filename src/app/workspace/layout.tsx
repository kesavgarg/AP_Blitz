import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth";
import { isEducationalVideoTaker, isOneTimeMember, isPromotionalMember, oneTimePathAllowed } from "@/lib/one-time";
import { prisma } from "@/lib/prisma";
import { WorkspaceNav, type NavItem } from "@/components/workspace/nav";
import { ThemeToggle } from "@/components/workspace/theme-toggle";
import { OneTimeGate } from "@/components/workspace/one-time-gate";
import { ViewAsBanner } from "@/components/view-as-banner";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role === "BLITZER") redirect("/student/dashboard");
  const [oneTime, promotional, educational, unread] = await Promise.all([
    isOneTimeMember(user.id, user.role),
    isPromotionalMember(user.id, user.role),
    isEducationalVideoTaker(user.id, user.role, user.teams),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  const pathname = (await headers()).get("x-pathname") || "";
  if (oneTime && pathname.startsWith("/workspace") && !oneTimePathAllowed(pathname)) {
    redirect("/workspace/about");
  }
  if (promotional && pathname.startsWith("/workspace/pipeline")) {
    redirect("/workspace/trends");
  }

  const items: NavItem[] = [];
  const founder = user.role === "FOUNDER";
  const recordGuide = !oneTime && educational;
  const promoGuide = !oneTime && promotional;
  const five = !oneTime && !founder && user.teams.some((team) => team.key === "FIVE_FOR_FIVE");
  if (oneTime) {
    items.push(
      { href: "/workspace/about", label: "What AP Blitz is", icon: "⚡" },
      { href: "/workspace/one-video", label: "Step 1", icon: "1️⃣" },
      { href: "/workspace/trends", label: "Step 2 · Pick", icon: "📈" },
      { href: "/workspace/send", label: "Step 3 · Send", icon: "📤" },
      { href: "/workspace/commitment", label: "Step 4 · After", icon: "✅" },
    );
  } else {
  if (isAdmin(user)) {
    items.push({ href: "/admin", label: "Admin", icon: "🛠️" });
  }
  items.push(
    { href: "/workspace", label: "Overview", icon: "🏠" },
    { href: "/workspace/messages", label: "Messages", icon: "💬" },
    { href: "/workspace/tasks", label: "My Tasks", icon: "✅" },
    { href: "/workspace/calendar", label: "Calendar", icon: "📅" },
  );
  if (!promotional) {
    items.push({ href: "/workspace/pipeline", label: "Content Pipeline", icon: "🎬" });
  }
  items.push(
    { href: "/workspace/videos", label: "Videos", icon: "▶️" },
    { href: "/workspace/trends", label: "Trends", icon: "📈" },
  );
  if (recordGuide) items.push({ href: "/workspace/how-to-record", label: "How to record", icon: "🎥" });
  if (promoGuide) items.push({ href: "/workspace/promo-guide", label: "How to record and edit", icon: "🎞️" });
  if (founder) items.push({ href: "/workspace/scripts", label: "Scripts", icon: "✍️" });
  if (educational) {
    items.push({ href: "/workspace/open-scripts", label: "Scripts", icon: "✍️" });
    items.push({ href: "/workspace/accepted", label: "Accepted", icon: "📌" });
  }
  if (five) items.push({ href: "/workspace/five", label: "5 For 5", icon: "📚" });
  if (!founder && user.role === "TEAM_ADMIN") {
    items.push({ href: "/admin/applications", label: "Applications", icon: "📥" });
  }
  items.push(
    { href: "/workspace/completed", label: "Completed Work", icon: "📦" },
    { href: "/workspace/daily-log", label: "Daily Logs", icon: "📝" },
    { href: "/workspace/meetings", label: "Meetings", icon: "🗓️" },
  );
  if (!founder) {
    items.push({ href: "/workspace/announcements", label: "Announcements", icon: "📣" });
  }
  if (user.role !== "FOUNDER") {
    items.push({
      href: "/workspace/notifications",
      label: unread ? `Alerts (${unread})` : "Notifications",
      icon: "🔔",
      badge: unread || undefined,
    });
  }
  items.push({ href: "/workspace/profile", label: "Profile", icon: "🙂" });
  }

  const roleLabel = oneTime
    ? "One video"
    : promotional
      ? "Promotional videos"
      : educational
        ? "Educational videos"
    :
    user.role === "FOUNDER"
      ? "Founder"
      : user.role === "TEAM_ADMIN"
        ? "Team admin"
        : user.teams[0]?.name ?? "Member";

  return (
    <div id="workspace-root" className="ws-dark flex min-h-screen bg-[#0c0c10] text-[#f6f1e8]">
      <div className="flex min-w-0 flex-1 flex-col">
      {user.viewingAs ? <ViewAsBanner name={`${user.firstName} ${user.lastName}`} /> : null}
      <div className="flex min-h-screen min-w-0 flex-1">
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
            {oneTime ? null : user.role === "FOUNDER" ? (
              <Link href="/admin/alerts" className="rounded-full bg-ink px-3 py-1 text-paper">
                Alerts
              </Link>
            ) : (
            <Link href="/workspace/notifications" className="rounded-full bg-ink px-3 py-1 text-paper">
              {unread ? `${unread} new` : "Caught up"}
            </Link>
            )}
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-8">
          <OneTimeGate active={Boolean(oneTime)}>{children}</OneTimeGate>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
