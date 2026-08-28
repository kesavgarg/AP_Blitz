"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus, PermissionRole, TeamKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireFounder, hashPassword } from "@/lib/auth";
import { logActivity, notify } from "@/lib/activity";
import { sendAcceptance, sendRejection, sendTestEmail } from "@/lib/email";
import { getRoleByKey } from "@/lib/roles";
import { getOrgSettings } from "@/lib/settings";
import { generateTempPassword } from "@/lib/flash";

export async function updateApplicationStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ApplicationStatus;
  const allowed: ApplicationStatus[] = ["NEW", "UNDER_REVIEW", "WAITLISTED"];
  if (!allowed.includes(status)) return;
  await prisma.application.update({
    where: { id },
    data: { status, reviewedAt: new Date(), reviewedById: admin.id },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
}

export async function rejectApplication(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") || "");
  const reason = String(formData.get("reason") || "").trim();
  const app = await prisma.application.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectReason: reason || null,
      reviewedAt: new Date(),
      reviewedById: admin.id,
    },
  });
  const mail = await sendRejection(app.email, app.firstName, reason || undefined);
  await prisma.application.update({
    where: { id },
    data: { lastEmailStatus: mail.sent ? "sent" : mail.error || "failed" },
  });
  await logActivity({
    userId: admin.id,
    action: `${admin.firstName} rejected ${app.firstName} ${app.lastName}`,
    objectType: "Application",
    objectId: app.applicationId,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
}

export async function acceptApplication(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") || "");
  const role = String(formData.get("role") || "") as TeamKey;
  const makeLeader = formData.get("makeLeader") === "on";
  const permission: PermissionRole = makeLeader ? "TEAM_ADMIN" : "MEMBER";

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return;

  const team = await prisma.team.findUnique({ where: { key: role } });
  if (!team) return;

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const email = app.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  let userId = existing?.id;

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        email,
        firstName: app.firstName,
        lastName: app.lastName,
        phone: app.phone,
        gradeLevel: app.gradeLevel,
        highSchool: app.highSchool,
        cityCounty: app.cityCounty,
        role: permission,
        isActive: true,
        mustChangePassword: true,
        passwordHash,
      },
    });
    userId = user.id;
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: existing.role === "FOUNDER" ? "FOUNDER" : permission,
        isActive: true,
        mustChangePassword: existing.role !== "FOUNDER",
        passwordHash,
        phone: existing.phone ?? app.phone,
      },
    });
  }

  await prisma.teamMembership.upsert({
    where: { userId_teamId: { userId: userId!, teamId: team.id } },
    update: { isLeader: makeLeader },
    create: { userId: userId!, teamId: team.id, isLeader: makeLeader },
  });

  const roleName = getRoleByKey(role)?.name ?? role;
  const mail = await sendAcceptance(email, app.firstName, roleName, tempPassword);

  await prisma.application.update({
    where: { id },
    data: {
      status: "ACCEPTED",
      assignedRole: role,
      reviewedAt: new Date(),
      reviewedById: admin.id,
      acceptedUserId: userId,
      issuedTempPassword: tempPassword,
      lastEmailStatus: mail.sent ? "sent" : mail.error || "failed",
    },
  });

  await notify({
    userId: userId!,
    title: "Welcome to AP Blitz",
    body: `You're accepted as a ${roleName}. Log in to open the workspace.`,
    href: "/workspace",
  });
  await logActivity({
    userId: admin.id,
    action: `${admin.firstName} accepted ${app.firstName} ${app.lastName} as ${roleName}`,
    objectType: "Application",
    objectId: app.applicationId,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin/team");
  redirect(`/admin/applications/${id}`);
}

export async function updateMemberRole(formData: FormData) {
  const founder = await requireFounder();
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "") as PermissionRole;
  if (!["FOUNDER", "TEAM_ADMIN", "MEMBER"].includes(role)) return;
  if (userId === founder.id && role !== "FOUNDER") return;
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logActivity({
    userId: founder.id,
    action: `${founder.firstName} changed a member's permission to ${role}`,
    objectType: "User",
    objectId: userId,
  });
  revalidatePath("/admin/team");
}

export async function setTeamLeader(formData: FormData) {
  await requireFounder();
  const userId = String(formData.get("userId") || "");
  const teamId = String(formData.get("teamId") || "");
  const isLeader = formData.get("isLeader") === "true";
  await prisma.teamMembership.update({
    where: { userId_teamId: { userId, teamId } },
    data: { isLeader },
  });
  if (isLeader) {
    await prisma.user.updateMany({
      where: { id: userId, role: "MEMBER" },
      data: { role: "TEAM_ADMIN" },
    });
  }
  revalidatePath("/admin/team");
}

export async function deactivateUser(formData: FormData) {
  const founder = await requireFounder();
  const userId = String(formData.get("userId") || "");
  if (userId === founder.id) return;
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  await prisma.session.deleteMany({ where: { userId } });
  revalidatePath("/admin/team");
}

export async function saveOrgSettings(formData: FormData) {
  await requireFounder();
  const existing = await getOrgSettings();
  const smtpPass = String(formData.get("smtpPass") || "").trim();
  await prisma.orgSettings.upsert({
    where: { id: "org" },
    update: {
      orgName: String(formData.get("orgName") || "AP Blitz"),
      founderName: String(formData.get("founderName") || ""),
      founderTitle: String(formData.get("founderTitle") || "Founder"),
      founderBio: String(formData.get("founderBio") || ""),
      contactEmail: String(formData.get("contactEmail") || ""),
      contactPhone: String(formData.get("contactPhone") || ""),
      founderVideoUrl: String(formData.get("founderVideoUrl") || ""),
      founderVideoType: String(formData.get("founderVideoType") || "youtube"),
      defaultMeetingLink: String(formData.get("defaultMeetingLink") || ""),
      brandTagline: String(formData.get("brandTagline") || ""),
      smtpHost: String(formData.get("smtpHost") || ""),
      smtpPort: String(formData.get("smtpPort") || "587"),
      smtpUser: String(formData.get("smtpUser") || ""),
      smtpPass: smtpPass || existing.smtpPass,
    },
    create: { id: "org" },
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function testEmailSettings(formData: FormData) {
  await requireFounder();
  const to = String(formData.get("testTo") || "").trim();
  if (!to) return;
  await sendTestEmail(to);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/emails");
}

