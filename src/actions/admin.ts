"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus, PermissionRole, TeamKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireFounder, hashPassword, revokeUserSessions } from "@/lib/auth";
import { logActivity, notify } from "@/lib/activity";
import { appUrl, sendAcceptance, sendBlitzerPromoted, sendRejection, sendTestEmail } from "@/lib/email";
import { getRoleByKey, isActiveTeamKey } from "@/lib/roles";
import { getOrgSettings } from "@/lib/settings";
import { cleanInstagramUrl } from "@/lib/videos";
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
  const roles = formData
    .getAll("roles")
    .map((v) => String(v))
    .filter(Boolean) as TeamKey[];
  const fallback = String(formData.get("role") || "") as TeamKey;
  const selected = (roles.length ? roles : fallback ? [fallback] : []).filter(isActiveTeamKey);
  if (!selected.length) return;
  const primary = selected[0];
  const makeLeader = formData.get("makeLeader") === "on";
  const permission: PermissionRole = makeLeader ? "TEAM_ADMIN" : "MEMBER";

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return;

  const teams = await prisma.team.findMany({ where: { key: { in: selected } } });
  if (!teams.length) return;

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const email = app.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  let userId = existing?.id;
  const keepBlitzerPassword = Boolean(existing?.role === "BLITZER" && existing.passwordHash);

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
        imageUrl: app.photoUrl || null,
      },
    });
    userId = user.id;
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: existing.role === "FOUNDER" ? "FOUNDER" : permission,
        isActive: true,
        mustChangePassword: existing.role === "FOUNDER" || keepBlitzerPassword ? false : true,
        passwordHash: keepBlitzerPassword ? existing.passwordHash :         passwordHash,
        phone: existing.phone ?? app.phone,
        imageUrl: app.photoUrl || existing.imageUrl,
      },
    });
    if (existing.role !== "FOUNDER" && existing.role !== permission) {
      await revokeUserSessions(existing.id);
    }
  }

  for (const team of teams) {
    await prisma.teamMembership.upsert({
      where: { userId_teamId: { userId: userId!, teamId: team.id } },
      update: { isLeader: makeLeader && team.key === primary },
      create: { userId: userId!, teamId: team.id, isLeader: makeLeader && team.key === primary },
    });
  }

  const roleName = selected.map((r) => getRoleByKey(r)?.name ?? r).join(", ");
  const inviteToken = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
  await prisma.inviteToken.create({
    data: {
      userId: userId!,
      token: inviteToken,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  const site = await appUrl();
  const setupUrl = `${site}/setup-account?token=${inviteToken}`;
  const loginUrl = `${site}/login?email=${encodeURIComponent(email)}`;
  const oneTimeNote = app.commitment === "ONE_TIME"
    ? "<p>Log in after you choose a password. You will see video ideas, a page to message Kesav, and a way to apply again as a full-time member.</p>"
    : "";
  const mail = keepBlitzerPassword
    ? await sendBlitzerPromoted(email, app.firstName, roleName, loginUrl)
    : await sendAcceptance(email, app.firstName, roleName, tempPassword, { setupUrl, loginUrl }, oneTimeNote);

  await prisma.application.update({
    where: { id },
    data: {
      status: "ACCEPTED",
      assignedRole: primary,
      reviewedAt: new Date(),
      reviewedById: admin.id,
      acceptedUserId: userId,
      issuedTempPassword: keepBlitzerPassword ? null : tempPassword,
      lastEmailStatus: mail.sent ? "sent" : mail.error || "failed",
    },
  });

  await notify({
    userId: userId!,
    title: "Welcome to AP Blitz",
    body: app.commitment === "ONE_TIME"
      ? "You're accepted. Log in and pick one video idea."
      : `You're accepted as a ${roleName}. Log in to open the workspace.`,
    href: app.commitment === "ONE_TIME" ? "/workspace/trends" : "/workspace",
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
  if (userId === founder.id) return;
  if (role === "FOUNDER" || !["TEAM_ADMIN", "MEMBER", "BLITZER"].includes(role)) return;
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target || target.role === "FOUNDER" || target.role === role) return;
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await revokeUserSessions(userId);
  await logActivity({
    userId: founder.id,
    action: `${founder.firstName} changed a member's permission to ${role}`,
    objectType: "User",
    objectId: userId,
  });
  revalidatePath("/admin/team");
  revalidatePath("/admin/sessions");
}

export async function addMemberToTeam(formData: FormData) {
  await requireFounder();
  const userId = String(formData.get("userId") || "");
  const teamKey = String(formData.get("teamKey") || "") as TeamKey;
  if (!isActiveTeamKey(teamKey)) return;
  const team = await prisma.team.findUnique({ where: { key: teamKey } });
  if (!userId || !team) return;
  await prisma.teamMembership.upsert({
    where: { userId_teamId: { userId, teamId: team.id } },
    update: {},
    create: { userId, teamId: team.id },
  });
  revalidatePath("/admin/team");
  revalidatePath("/workspace/team");
}

async function deleteMemberAccount(founderId: string, founderName: string, userId: string) {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, firstName: true, lastName: true, email: true },
  });
  if (!target || target.role === "FOUNDER" || userId === founderId) return;

  await prisma.$transaction(async (tx) => {
    await tx.application.updateMany({ where: { reviewedById: userId }, data: { reviewedById: null } });
    await tx.application.updateMany({ where: { acceptedUserId: userId }, data: { acceptedUserId: null } });
    await tx.messagePin.deleteMany({ where: { userId } });
    await tx.message.deleteMany({ where: { authorId: userId } });
    await tx.socialIdea.updateMany({ where: { authorId: userId }, data: { authorId: founderId } });
    await tx.script.updateMany({ where: { authorId: userId }, data: { authorId: founderId } });
    await tx.fileAsset.updateMany({ where: { uploadedById: userId }, data: { uploadedById: founderId } });
    await tx.task.updateMany({ where: { assigneeId: userId }, data: { assigneeId: null } });
    await tx.task.updateMany({ where: { creatorId: userId }, data: { creatorId: founderId } });
    await tx.meeting.updateMany({ where: { hostId: userId }, data: { hostId: founderId } });
    await tx.trendLink.updateMany({ where: { createdById: userId }, data: { createdById: founderId } });
    await tx.trendLink.updateMany({ where: { claimedById: userId }, data: { claimedById: null } });
    await tx.announcement.updateMany({ where: { authorId: userId }, data: { authorId: founderId } });
    await tx.contentItem.updateMany({ where: { ownerId: userId }, data: { ownerId: null } });
    await tx.contentItem.updateMany({ where: { completedById: userId }, data: { completedById: null } });
    await tx.seoRequest.updateMany({ where: { specialistId: userId }, data: { specialistId: null } });
    await tx.calendarEvent.updateMany({ where: { createdById: userId }, data: { createdById: null } });
    await tx.libraryVideo.updateMany({ where: { ownerId: userId }, data: { ownerId: null } });
    await tx.libraryVideo.updateMany({ where: { publishedById: userId }, data: { publishedById: null } });
    await tx.videoEvent.updateMany({ where: { userId }, data: { userId: null } });
    await tx.activityLog.updateMany({ where: { userId }, data: { userId: null } });
    await tx.session.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  await logActivity({
    userId: founderId,
    action: `${founderName} removed ${target.firstName} ${target.lastName} from AP Blitz`,
    objectType: "User",
    objectId: userId,
  });
  revalidatePath("/admin/team");
  revalidatePath("/workspace/team");
}

export async function removeMemberFromTeam(formData: FormData) {
  const founder = await requireFounder();
  const userId = String(formData.get("userId") || "");
  const teamId = String(formData.get("teamId") || "");
  if (!userId || !teamId || userId === founder.id) return;
  const others = await prisma.teamMembership.findMany({
    where: { userId, teamId: { not: teamId } },
    select: { team: { select: { key: true } } },
  });
  if (!others.some((row) => isActiveTeamKey(row.team.key))) {
    await deleteMemberAccount(founder.id, founder.firstName, userId);
    return;
  }
  await prisma.teamMembership.deleteMany({ where: { userId, teamId } });
  await logActivity({
    userId: founder.id,
    action: `${founder.firstName} removed a member from a role`,
    objectType: "User",
    objectId: userId,
  });
  revalidatePath("/admin/team");
  revalidatePath("/workspace/team");
  revalidatePath("/workspace");
}

export async function addShowcaseClip(formData: FormData) {
  await requireFounder();
  const url = String(formData.get("url") || "").trim();
  const title = String(formData.get("title") || "").trim() || "AP Blitz reel";
  if (!url) return;
  const last = await prisma.showcaseClip.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.showcaseClip.create({
    data: { url, title, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function deleteShowcaseClip(formData: FormData) {
  await requireFounder();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.showcaseClip.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/settings");
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

export async function clearMemberTeams(formData: FormData) {
  const founder = await requireFounder();
  const userId = String(formData.get("userId") || "");
  if (!userId) return;
  await deleteMemberAccount(founder.id, founder.firstName, userId);
}

export async function kickMember(formData: FormData) {
  const founder = await requireFounder();
  const userId = String(formData.get("userId") || "");
  if (!userId) return;
  await deleteMemberAccount(founder.id, founder.firstName, userId);
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
      instagramUrl: cleanInstagramUrl(String(formData.get("instagramUrl") || "")) ?? existing.instagramUrl,
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

export async function revokeSessionAction(formData: FormData) {
  const founder = await requireFounder();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const session = await prisma.session.findUnique({ where: { id }, select: { userId: true } });
  if (!session) return;
  await prisma.session.delete({ where: { id } });
  await logActivity({
    userId: founder.id,
    action: `${founder.firstName} ended an active session`,
    objectType: "User",
    objectId: session.userId,
  });
  revalidatePath("/admin/sessions");
}

export async function testEmailSettings(formData: FormData) {
  await requireFounder();
  const to = String(formData.get("testTo") || "").trim();
  if (!to) return;
  await sendTestEmail(to);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/emails");
}

