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
    firstChoice: formData.get("firstChoice"),
    secondChoice: formData.get("secondChoice"),
    experience: formData.get("experience") || "",
    expectContribute: formData.get("expectContribute"),
    expectRespond: formData.get("expectRespond"),
    expectRemoval: formData.get("expectRemoval"),
    expectConduct: formData.get("expectConduct"),
    expectDeadlines: formData.get("expectDeadlines"),
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
      firstChoice: data.firstChoice,
      secondChoice: data.secondChoice,
      experience: data.experience || null,
      expectContribute: data.expectContribute,
      expectRespond: data.expectRespond,
      expectRemoval: data.expectRemoval,
      expectConduct: data.expectConduct,
      expectDeadlines: data.expectDeadlines,
      deadlineScenario: data.deadlineScenario,
      additionalInfo: data.additionalInfo || null,
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
        body: `${data.firstName} ${data.lastName} applied (${applicationId}). Open Applications to accept or decline.`,
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
