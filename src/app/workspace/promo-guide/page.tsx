import { notFound } from "next/navigation";
import { isAdmin, requireTeam } from "@/lib/auth";
import { isPromotionalMember } from "@/lib/one-time";
import { getOrgSettings } from "@/lib/settings";
import { GuidePlayer } from "@/components/workspace/guide-player";

export const dynamic = "force-dynamic";

export default async function PromoGuidePage() {
  const user = await requireTeam();
  const promotional = await isPromotionalMember(user.id, user.role);
  if (!isAdmin(user) && !promotional) notFound();
  const settings = await getOrgSettings();

  return (
    <GuidePlayer
      fileId={settings.promoGuideFileId}
      title="How to record and edit"
      body="Watch this before you make a promotional video. Kesav shows how to record and how to edit. These videos are yours to finish and text to Kesav. They do not go into the content pipeline, and this guide is not posted to Instagram."
      waiting="The record-and-edit video is not up yet. It will play here after Kesav uploads it from his computer."
    />
  );
}
