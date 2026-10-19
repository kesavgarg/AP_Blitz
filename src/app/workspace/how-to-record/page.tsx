import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeam } from "@/lib/auth";
import { isEducationalVideoTaker } from "@/lib/one-time";
import { getOrgSettings } from "@/lib/settings";
import { GuidePlayer } from "@/components/workspace/guide-player";

export const dynamic = "force-dynamic";

export default async function HowToRecordPage() {
  const user = await requireTeam();
  if (!(await isEducationalVideoTaker(user.id, user.role))) notFound();
  const [settings, profile] = await Promise.all([
    getOrgSettings(),
    prisma.user.findUnique({ where: { id: user.id }, select: { educationalGuideSeenAt: true } }),
  ]);

  return (
    <GuidePlayer
      fileId={settings.howToRecordFileId}
      title="How to record"
      body="This is only for educational videos. Kesav walks through how to record. It stays on this tab and is not posted to Instagram."
      waiting="The how-to video is not up yet. It will play here after Kesav uploads it from his computer."
      firstVisit={!profile?.educationalGuideSeenAt}
      which="educational"
    />
  );
}
