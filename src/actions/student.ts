"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/activity";
import type { ActionState } from "@/actions/auth";

async function requireBlitzer() {
  const user = await requireUser();
  if (user.role !== "BLITZER") {
    return null;
  }
  return user;
}

export async function toggleClassAction(formData: FormData) {
  const user = await requireBlitzer();
  if (!user) return;
  const subjectId = String(formData.get("subjectId") || "");
  const subject = await prisma.apSubject.findFirst({ where: { id: subjectId, active: true } });
  if (!subject) return;
  const existing = await prisma.studentClass.findUnique({
    where: { userId_subjectId: { userId: user.id, subjectId } },
  });
  if (existing) {
    await prisma.studentClass.delete({ where: { id: existing.id } });
  } else {
    await prisma.studentClass.create({ data: { userId: user.id, subjectId } });
  }
  revalidatePath("/student/dashboard");
  revalidatePath("/student/classes");
}

export async function toggleSavedVideoAction(formData: FormData) {
  const user = await requireBlitzer();
  if (!user) return;
  const videoId = String(formData.get("videoId") || "");
  const video = await prisma.libraryVideo.findFirst({ where: { id: videoId, status: "PUBLISHED" } });
  if (!video) return;
  const existing = await prisma.savedVideo.findUnique({
    where: { userId_videoId: { userId: user.id, videoId } },
  });
  if (existing) {
    await prisma.savedVideo.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedVideo.create({ data: { userId: user.id, videoId } });
  }
  revalidatePath("/student/saved");
  revalidatePath("/student/dashboard");
  revalidatePath(`/videos/watch/${videoId}`);
}

const requestSchema = z.object({
  subjectId: z.string().min(1, "Pick an AP subject"),
  unit: z.string().trim().min(2, "Add the unit or topic").max(160),
  prompt: z.string().trim().min(8, "Tell us what you want explained").max(2000),
  details: z.string().trim().max(4000).optional().or(z.literal("")),
});

export async function submitVideoRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireBlitzer();
  if (!user) return { error: "Log in with a Blitzer account to request a video." };
  const ip = clientIp(await headers());
  const limited = await rateLimit(`request:${user.id}:${ip}`, 10, 60 * 60 * 1000);
  if (!limited.ok) return { error: "Too many requests. Try again later." };

  const parsed = requestSchema.safeParse({
    subjectId: formData.get("subjectId"),
    unit: formData.get("unit"),
    prompt: formData.get("prompt"),
    details: formData.get("details") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const subject = await prisma.apSubject.findFirst({ where: { id: parsed.data.subjectId, active: true } });
  if (!subject) return { error: "That AP subject is not on AP Blitz." };

  await prisma.videoRequest.create({
    data: {
      userId: user.id,
      subjectId: subject.id,
      unit: parsed.data.unit,
      prompt: parsed.data.prompt,
      details: parsed.data.details || null,
    },
  });
  const admins = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["FOUNDER", "TEAM_ADMIN"] } },
    select: { id: true },
  });
  for (const admin of admins) {
    await notify({
      userId: admin.id,
      title: "New video request",
      body: `${subject.name}: ${parsed.data.unit}`,
      href: "/admin/requests",
      kind: "requestUpdates",
    });
  }
  revalidatePath("/student/requests");
  revalidatePath("/admin/requests");
  return { success: "Request sent. AP Blitz can see it in the admin queue." };
}

const feedbackSchema = z.object({
  kind: z.enum(["general", "video", "suggestion", "bug"]),
  subjectId: z.string().optional().or(z.literal("")),
  message: z.string().trim().min(8, "Write a bit more so we can use it").max(4000),
  videoId: z.string().optional().or(z.literal("")),
});

export async function submitFeedbackAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireBlitzer();
  if (!user) return { error: "Log in with a Blitzer account to send feedback." };
  const limited = await rateLimit(`feedback:${user.id}`, 8, 60 * 60 * 1000);
  if (!limited.ok) return { error: "Too much feedback at once. Try again later." };
  const parsed = feedbackSchema.safeParse({
    kind: formData.get("kind"),
    subjectId: formData.get("subjectId") || "",
    message: formData.get("message"),
    videoId: formData.get("videoId") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  let subjectId: string | null = null;
  if (parsed.data.subjectId) {
    const subject = await prisma.apSubject.findFirst({ where: { id: parsed.data.subjectId, active: true } });
    if (!subject) return { error: "That subject is not available." };
    subjectId = subject.id;
  }
  let videoId: string | null = null;
  if (parsed.data.videoId) {
    const video = await prisma.libraryVideo.findFirst({ where: { id: parsed.data.videoId, status: "PUBLISHED" } });
    if (!video) return { error: "That video is not in the public library." };
    videoId = video.id;
  }
  await prisma.feedbackSubmission.create({
    data: {
      userId: user.id,
      kind: parsed.data.kind,
      subjectId,
      message: parsed.data.message,
      videoId,
    },
  });
  const founders = await prisma.user.findMany({
    where: { isActive: true, role: "FOUNDER" },
    select: { id: true },
  });
  for (const founder of founders) {
    await notify({
      userId: founder.id,
      title: "New Blitzer feedback",
      body: parsed.data.message.slice(0, 140),
      href: "/admin/feedback",
    });
  }
  revalidatePath("/student/feedback");
  revalidatePath("/admin/feedback");
  return { success: "Thanks — the founder can see this." };
}

export async function saveNotificationPreferencesAction(formData: FormData) {
  const user = await requireUser();
  const scope = String(formData.get("scope") || "team");
  const keys = scope === "student"
    ? (["newVideos", "subjectVideos", "announcements", "requestUpdates"] as const)
    : (["newVideos", "announcements", "requestUpdates", "teamMessages", "deadlines", "meetings"] as const);
  const existing = await prisma.notificationPreference.findUnique({ where: { userId: user.id } });
  const data = {
    newVideos: existing?.newVideos ?? true,
    subjectVideos: existing?.subjectVideos ?? true,
    announcements: existing?.announcements ?? true,
    requestUpdates: existing?.requestUpdates ?? true,
    teamMessages: existing?.teamMessages ?? true,
    deadlines: existing?.deadlines ?? true,
    meetings: existing?.meetings ?? true,
  };
  for (const key of keys) data[key] = formData.get(key) === "on";
  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
  revalidatePath("/student/notifications");
  revalidatePath("/workspace/notifications");
}

export async function savePushSubscriptionAction(payload: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const user = await requireUser();
  if (!payload?.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
    return { error: "That browser did not return a push subscription." };
  }
  if (payload.endpoint.length > 2000) return { error: "Subscription was rejected." };
  await prisma.pushSubscription.upsert({
    where: { endpoint: payload.endpoint },
    update: { userId: user.id, p256dh: payload.keys.p256dh, auth: payload.keys.auth },
    create: {
      userId: user.id,
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
    },
  });
  revalidatePath("/student/notifications");
  revalidatePath("/workspace/notifications");
  return { ok: true };
}

export async function removePushSubscriptionAction() {
  const user = await requireUser();
  await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
  revalidatePath("/student/notifications");
  revalidatePath("/workspace/notifications");
}

export async function updateBlitzerProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireBlitzer();
  if (!user) return { error: "Blitzer accounts only." };
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  if (!firstName || !lastName) return { error: "First and last name are required." };
  await prisma.user.update({
    where: { id: user.id },
    data: { firstName: firstName.slice(0, 80), lastName: lastName.slice(0, 80) },
  });
  revalidatePath("/student/profile");
  revalidatePath("/student/dashboard");
  return { success: "Profile saved." };
}
