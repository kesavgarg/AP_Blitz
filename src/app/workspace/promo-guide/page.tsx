import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeam } from "@/lib/auth";
import { isPromotionalMember } from "@/lib/one-time";
import { getOrgSettings } from "@/lib/settings";
import { GuidePlayer } from "@/components/workspace/guide-player";

export const dynamic = "force-dynamic";

export default async function PromoGuidePage() {
  const user = await requireTeam();
  if (!(await isPromotionalMember(user.id, user.role))) notFound();
  const [settings, profile] = await Promise.all([
    getOrgSettings(),
    prisma.user.findUnique({ where: { id: user.id }, select: { promoGuideSeenAt: true } }),
  ]);

  return (
    <GuidePlayer
      fileId={settings.promoGuideFileId}
      title="How to record and edit"
      body="This is a different video from the educational one. It is only for promotional videos. Kesav shows how to record and how to edit. Finish the video yourself and text it to Kesav. It does not go into the content pipeline."
      waiting="The record-and-edit video is not up yet. It will play here after Kesav uploads it from his computer."
      firstVisit={!profile?.promoGuideSeenAt}
      which="promo"
    />
  );
}
