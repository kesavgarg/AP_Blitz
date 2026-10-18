import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireTeam } from "@/lib/auth";
import { isOneTimeMember } from "@/lib/one-time";
import { getOrgSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SendVideoPage() {
  const user = await requireTeam();
  if (!(await isOneTimeMember(user.id, user.role)) && !isAdmin(user)) redirect("/workspace");
  const settings = await getOrgSettings();
  const phone = settings.contactPhone || "+1 (404) 213-9019";

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-volt">Step 3</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Send the video to Kesav</h1>
      <p className="mt-4 text-sm text-ink/80">
        Record the one you picked. Then send the file to Kesav at{" "}
        <a className="font-semibold text-volt" href="sms:+14042139019">{phone}</a>.
      </p>
      <p className="mt-3 text-sm text-ink/70">Text is enough. You do not upload it on this site.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href="sms:+14042139019" className="rounded-full bg-volt px-5 py-3 text-sm font-semibold text-ink">
          Text {phone}
        </a>
        <Link href="/workspace/commitment" className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold">
          Step 4: after you send it
        </Link>
      </div>
    </div>
  );
}
