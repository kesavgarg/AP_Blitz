import { getSessionUser } from "@/lib/auth";
import { getOrgSettings } from "@/lib/settings";
import { bootCatalog } from "@/lib/catalog";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { WelcomePopup } from "@/components/public/welcome-popup";
import { FollowPrompt } from "@/components/public/follow-prompt";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [, user, settings] = await Promise.all([bootCatalog(), getSessionUser(), getOrgSettings()]);
  const accountHref = !user
    ? "/login"
    : user.role === "BLITZER"
      ? "/student/dashboard"
      : user.role === "FOUNDER"
        ? "/admin"
        : "/workspace";
  return (
    <div className="mesh min-h-screen">
      <PublicHeader signedIn={Boolean(user)} accountHref={accountHref} />
      <main>{children}</main>
      <PublicFooter email={settings.contactEmail} phone={settings.contactPhone} instagramUrl={settings.instagramUrl} />
      <WelcomePopup instagramUrl={settings.instagramUrl} signedIn={Boolean(user)} />
      <FollowPrompt instagramUrl={settings.instagramUrl || undefined} />
    </div>
  );
}
