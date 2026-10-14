"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { appUrl, sendPasswordReset, sendVerificationEmail, sendWelcomeBlitzer } from "@/lib/email";
import type { ActionState } from "@/actions/auth";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    email: z.string().trim().email("Enter a valid email").max(160),
    password: z
      .string()
      .min(10, "Use at least 10 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
    followsInstagram: z.enum(["yes", "no"], { message: "Tell us if you follow AP Blitz on Instagram." }),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export async function registerBlitzerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = clientIp(await headers());
  const limited = await rateLimit(`register:${ip}`, 8, 30 * 60 * 1000);
  if (!limited.ok) return { error: "Too many signups from this network. Try again later." };

  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    followsInstagram: formData.get("followsInstagram"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "That email already has an AP Blitz account. Log in instead." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      passwordHash,
      role: "BLITZER",
      isActive: true,
      followsInstagram: parsed.data.followsInstagram === "yes",
    },
  });

  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });
  const site = await appUrl();
  const verifyUrl = `${site}/verify-email?token=${token}`;
  const [welcome, verify] = await Promise.all([
    sendWelcomeBlitzer(email, user.firstName),
    sendVerificationEmail(email, user.firstName, verifyUrl),
  ]);
  if (!verify.sent) console.info("[verify-email]", verifyUrl);

  await createSession(user.id);
  await logActivity({
    userId: user.id,
    action: `${user.firstName} ${user.lastName} created a Blitzer account${parsed.data.followsInstagram === "yes" ? " and follows on Instagram" : " and does not follow on Instagram yet"}`,
  });
  if (!welcome.sent) {
    console.info("[welcome-email] not delivered for", email);
  }
  redirect("/student/dashboard");
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headerList = await headers();
  const ip = clientIp(headerList);
  const emailForLimit = String(formData.get("email") || "").trim().toLowerCase();
  const [byIp, byAccount] = await Promise.all([
    rateLimit(`reset:ip:${ip}`, 6, 30 * 60 * 1000),
    rateLimit(`reset:acct:${emailForLimit || ip}`, 4, 30 * 60 * 1000),
  ]);
  const limited = { ok: byIp.ok && byAccount.ok };
  if (!limited.ok) return { error: "Too many reset requests. Wait a bit and try again." };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const parsed = z.string().email().safeParse(email);
  const message = "If that email has an account, a reset link is on its way. If nothing arrives, email delivery may not be configured yet.";
  if (!parsed.success) return { success: message };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.isActive) {
    const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const link = `${await appUrl()}/reset-password?token=${token}`;
    const mail = await sendPasswordReset(user.email, user.firstName, link);
    if (!mail.sent) console.info("[password-reset]", link);
  }
  return { success: message };
}

const resetSchema = z
  .object({
    token: z.string().min(20),
    password: z
      .string()
      .min(10, "Use at least 10 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const reset = await prisma.passwordReset.findUnique({
    where: { token: parsed.data.token },
    include: { user: true },
  });
  if (!reset || reset.usedAt || reset.expiresAt < new Date() || !reset.user.isActive) {
    return { error: "This reset link is invalid or expired." };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  await createSession(reset.userId);
  const dest = reset.user.role === "BLITZER" ? "/student/dashboard" : reset.user.role === "FOUNDER" ? "/admin" : "/workspace";
  redirect(dest);
}

