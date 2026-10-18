"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeam } from "@/lib/auth";
import { notify } from "@/lib/activity";
import { sendOneTimeJoinRequest } from "@/lib/email";
import { getOrgSettings } from "@/lib/settings";
import { GRADE_LABELS } from "@/lib/roles";
import { isOneTimeMember } from "@/lib/one-time";

export async function requestFullMembership() {
  const user = await requireTeam();
  const oneTime = await isOneTimeMember(user.id, user.role);
  if (!oneTime) return;
  const app = await prisma.application.findUnique({ where: { id: oneTime.applicationId } });
  if (!app || app.joinRequestedAt) return;

  await prisma.application.update({
    where: { id: app.id },
    data: { joinRequestedAt: new Date() },
  });

  const settings = await getOrgSettings();
  const to = settings.contactEmail || "kesavgarg@gmail.com";
  await sendOneTimeJoinRequest(to, {
    name: `${app.firstName} ${app.lastName}`,
    email: app.email,
    phone: app.phone,
    school: app.highSchool,
    city: app.cityCounty,
    grade: GRADE_LABELS[app.gradeLevel] ?? app.gradeLevel,
    apClasses: app.apClasses,
    applicationId: app.applicationId,
    applicationPath: `/admin/applications/${app.id}`,
  });

  const founder = await prisma.user.findFirst({
    where: { role: "FOUNDER", isActive: true },
    select: { id: true },
  });
  if (founder) {
    await notify({
      userId: founder.id,
      title: "One-video member wants to join",
      body: `${app.firstName} ${app.lastName} finished the one video and wants a team. Pick their team in Applications.`,
      href: `/admin/applications/${app.id}`,
    });
  }

  revalidatePath("/workspace/commitment");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${app.id}`);
}
