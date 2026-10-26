"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, requireRealUser, requireTeam, requireUser, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { saveUpload } from "@/lib/files";

export async function submitDailyLog(formData: FormData) {
  const user = await requireTeam();
  const whatDid = String(formData.get("whatDid") || "").trim();
  if (!whatDid) return;
  const hoursRaw = String(formData.get("hours") || "");
  const notes = String(formData.get("notes") || "") || null;
  const teamId = user.teams[0]
    ? (await prisma.team.findUnique({ where: { key: user.teams[0].key } }))?.id
    : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: {
      whatDid,
      hours: hoursRaw ? Number(hoursRaw) : null,
      notes,
      teamId,
    },
    create: {
      userId: user.id,
      date: today,
      whatDid,
      hours: hoursRaw ? Number(hoursRaw) : null,
      notes,
      teamId,
    },
  });
  await logActivity({
    userId: user.id,
    action: `${user.firstName} ${user.lastName} submitted daily activity log`,
    objectType: "DailyLog",
    objectId: user.id,
  });
  revalidatePath("/workspace/daily-log");
  revalidatePath("/admin/activity");
}

export async function markNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/workspace");
  revalidatePath("/workspace/notifications");
  revalidatePath("/student/notifications");
  revalidatePath("/student/dashboard");
  revalidatePath("/admin/alerts");
}

export async function markAdminAlertsRead() {
  const user = await requireRealUser();
  if (user.role !== "FOUNDER" && user.role !== "TEAM_ADMIN") return;
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/alerts");
}

export type ProfileState = { error?: string; success?: string } | undefined;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireTeam();
  const file = formData.get("image");
  let imageUrl: string | undefined;
  try {
    if (file instanceof File && file.size > 0) {
      const saved = await saveUpload(file, user.id);
      imageUrl = `/api/files/${saved.id}`;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: String(formData.get("firstName") || user.firstName),
        lastName: String(formData.get("lastName") || user.lastName),
        phone: String(formData.get("phone") || "") || null,
        bio: String(formData.get("bio") || "").trim() || null,
        ...(imageUrl ? { imageUrl } : {}),
      },
    });
  } catch (err) {
    console.error("[profile]", err);
    return {
      error: err instanceof Error ? err.message : "Could not save your profile photo. Try a JPG or PNG.",
    };
  }
  revalidatePath("/workspace/profile");
  revalidatePath("/workspace/team");
  revalidatePath("/workspace/messages");
  return { success: imageUrl ? "Photo saved. The team can see it now." : "Profile saved." };
}

export type PasswordState = { error?: string; success?: string } | undefined;

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const user = await requireTeam();
  const current = String(formData.get("currentPassword") || "");
  const next = String(formData.get("newPassword") || "");
  const confirm = String(formData.get("confirmPassword") || "");
  if (next.length < 10 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
    return { error: "New password needs at least 10 characters, a letter, and a number." };
  }
  if (next !== confirm) return { error: "New passwords do not match." };

  const full = await prisma.user.findUnique({ where: { id: user.id } });
  if (!full?.passwordHash) return { error: "No password is set on this account." };
  const ok = await verifyPassword(current, full.passwordHash);
  if (!ok) return { error: "Current password is wrong." };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(next), mustChangePassword: false },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
  await createSession(user.id);
  await prisma.application.updateMany({
    where: { acceptedUserId: user.id },
    data: { issuedTempPassword: null },
  });
  revalidatePath("/workspace");
  revalidatePath("/workspace/profile");
  return { success: "Password updated." };
}
