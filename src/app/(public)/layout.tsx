import { getSessionUser } from "@/lib/auth";
import { getOrgSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getSessionUser(), getOrgSettings()]);
  return (
    <div className="mesh min-h-screen">
      <PublicHeader signedIn={Boolean(user)} />
      <main>{children}</main>
      <PublicFooter email={settings.contactEmail} phone={settings.contactPhone} />
    </div>
  );
}
