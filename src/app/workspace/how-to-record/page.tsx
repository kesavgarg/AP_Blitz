import { notFound } from "next/navigation";
import { isAdmin, onTeam, requireTeam } from "@/lib/auth";
import { isEducationalVideoTaker, isPromotionalMember } from "@/lib/one-time";
import { getOrgSettings } from "@/lib/settings";
import { GuidePlayer } from "@/components/workspace/guide-player";

export const dynamic = "force-dynamic";

export default async function HowToRecordPage() {
  const user = await requireTeam();
  const [educational, promotional] = await Promise.all([
    isEducationalVideoTaker(user.id, user.role),
    isPromotionalMember(user.id, user.role),
  ]);
  const allowed = isAdmin(user) || (!promotional && (educational || onTeam(user, "VIDEO_CREATOR")));
  if (!allowed) notFound();
  const settings = await getOrgSettings();

  return (
    <GuidePlayer
      fileId={settings.howToRecordFileId}
      title="How to record"
      body="Watch this before you film an educational video. Kesav walks through how to record. It stays on this page. It is not posted to Instagram."
      waiting="The how-to video is not up yet. It will play here after Kesav uploads it from his computer."
    />
  );
}
