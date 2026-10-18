"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/validations";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { logActivity, nextApplicationId, notify } from "@/lib/activity";
import { sendAdminApplicationNotice, sendApplicationReceived } from "@/lib/email";
import { getOrgSettings } from "@/lib/settings";
import { getApplyLane } from "@/lib/roles";
import { saveUpload } from "@/lib/files";

export type ApplyState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | undefined;

export async function submitApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const ip = clientIp(await headers());
  const emailKey = String(formData.get("email") || "").trim().toLowerCase();
  const [byIp, byAccount] = await Promise.all([
    rateLimit(`apply:ip:${ip}`, 20, 30 * 60 * 1000),
    rateLimit(`apply:acct:${emailKey || ip}`, 5, 30 * 60 * 1000),
  ]);
  if (!byIp.ok || !byAccount.ok) return { error: "Too many applications from this network. Try later." };

  const parsed = applicationSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    gradeLevel: formData.get("gradeLevel"),
    highSchool: formData.get("highSchool"),
    cityCounty: formData.get("cityCounty"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    apClasses: formData.get("apClasses"),
    lane: formData.get("lane"),
    videoLane: formData.get("videoLane") || "",
    experience: formData.get("experience") || "",
    keepSiteOpen: formData.get("keepSiteOpen"),
    canBeRemoved: formData.get("canBeRemoved"),
    weeklyDeadline: formData.get("weeklyDeadline"),
    deadlineScenario: formData.get("deadlineScenario"),
    additionalInfo: formData.get("additionalInfo") || "",
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const lane = getApplyLane(data.lane);
  if (!lane) return { error: "Pick a role." };
  if (data.keepSiteOpen !== "YES" || data.canBeRemoved !== "YES" || data.weeklyDeadline !== "YES") {
    return { error: "You have to agree to all three of those to apply." };
  }
  if (lane.choosesVideos && data.videoLane !== "EDUCATIONAL" && data.videoLane !== "PROMOTIONAL") {
    return { error: "Video takers need to choose educational videos or promotional videos." };
  }
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size < 1) {
    return { error: "Upload a photo of yourself. That part is required." };
  }
  const founder = await prisma.user.findFirst({
    where: { role: "FOUNDER", isActive: true },
    select: { id: true },
  });
  if (!founder) return { error: "Applications are not open yet." };
  let photoUrl = "";
  try {
    const saved = await saveUpload(photo, founder.id);
    photoUrl = `/api/files/${saved.id}`;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "That photo could not be saved. Use a JPG or PNG." };
  }

  const applicationId = await nextApplicationId();
  const created = await prisma.application.create({
    data: {
      applicationId,
      firstName: data.firstName,
      lastName: data.lastName,
      gradeLevel: data.gradeLevel,
      highSchool: data.highSchool,
      cityCounty: data.cityCounty,
      email: data.email.toLowerCase(),
      phone: data.phone,
      apClasses: data.apClasses,
      firstChoice: lane.team,
      secondChoice: lane.team,
      experience: data.experience || null,
      expectContribute: data.keepSiteOpen,
      expectRespond: "YES",
      expectRemoval: data.canBeRemoved,
      expectConduct: "YES",
      expectDeadlines: data.weeklyDeadline,
      deadlineScenario: data.deadlineScenario,
      additionalInfo: data.additionalInfo || null,
      photoUrl,
      commitment: lane.commitment,
      videoLane: lane.choosesVideos ? String(data.videoLane) : "",
    },
  });

  await logActivity({
    action: `${data.firstName} ${data.lastName} submitted application ${applicationId}`,
    objectType: "Application",
    objectId: applicationId,
  });

  try {
    const settings = await getOrgSettings();
    const received = await sendApplicationReceived(data.email, data.firstName, applicationId);
    await sendAdminApplicationNotice(
      settings.contactEmail || "kesavgarg@gmail.com",
      `${data.firstName} ${data.lastName}`,
      applicationId,
    );
    await prisma.application.update({
      where: { id: created.id },
      data: { lastEmailStatus: received.sent ? "sent" : received.error || "failed" },
    });
  } catch (err) {
    console.error("[apply:email]", err);
  }

  try {
    const founder = await prisma.user.findFirst({
      where: { role: "FOUNDER", isActive: true },
      select: { id: true },
    });
    if (founder) {
      await notify({
        userId: founder.id,
        title: "New application",
        body: lane.commitment === "ONE_TIME"
          ? `${data.firstName} ${data.lastName} sent a photo and wants to film one video (${applicationId}). Accept or decline them.`
          : `${data.firstName} ${data.lastName} applied for ${lane.name} (${applicationId}). Open Applications to accept or decline.`,
        href: `/admin/applications/${created.id}`,
      });
    }
  } catch (err) {
    console.error("[apply:notify]", err);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${created.id}`);
  redirect(`/apply/confirmation?id=${encodeURIComponent(applicationId)}`);
}
