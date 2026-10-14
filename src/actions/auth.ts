"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  authSecret,
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema, setupAccountSchema } from "@/lib/validations";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { safeNextPath } from "@/lib/safe-path";
import { sendNewDeviceAlert } from "@/lib/email";

export type ActionState = { error?: string; success?: string } | undefined;

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headerList = await headers();
  const ip = clientIp(headerList);
  const userAgent = (headerList.get("user-agent") || "").slice(0, 400);
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const email = parsed.data.email.toLowerCase();
  const [byIp, byAccount] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 20, 10 * 60 * 1000),
    rateLimit(`login:acct:${email}`, 8, 10 * 60 * 1000),
  ]);
  if (!byIp.ok || !byAccount.ok) return { error: "Too many login attempts. Wait a few minutes." };

  if (!authSecret() || authSecret().length < 32) {
    console.error("[login] AUTH_SECRET is missing or too short");
    return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const passwordOk = Boolean(user?.passwordHash) && (await verifyPassword(parsed.data.password, user?.passwordHash || ""));
    if (!user || !user.passwordHash || !user.isActive || !passwordOk) {
      await prisma.activityLog.create({
        data: {
          userId: user?.id,
          action: `Failed login for ${email} from ${ip}`,
          metadata: { email, ip, userAgent },
        },
      });
      return { error: "Those credentials don't match an active AP Blitz account." };
    }

    if (user.role === "FOUNDER" || user.role === "TEAM_ADMIN") {
      const known = userAgent
        ? await prisma.session.count({ where: { userId: user.id, userAgent } })
        : 0;
      if (!known) {
        const founder = await prisma.user.findFirst({
          where: { role: "FOUNDER", isActive: true },
          select: { email: true },
        });
        if (founder) {
          await sendNewDeviceAlert(founder.email, {
            account: user.email,
            role: user.role,
            ip,
            userAgent: userAgent || "unknown",
          });
        }
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await createSession(user.id);
    await logActivity({
      userId: user.id,
      action: `${user.firstName} ${user.lastName} logged in`,
      metadata: { ip, userAgent },
    });

    const dest =
      safeNextPath(String(formData.get("next") || ""), user.role) ??
      (user.role === "BLITZER" ? "/student/dashboard" : user.role === "FOUNDER" ? "/admin" : "/workspace");
    redirect(dest);
  } catch (err) {
    if (
      typeof err === "object" &&
      err &&
      "digest" in err &&
      typeof err.digest === "string" &&
      err.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("[login]", err);
    return { error: "Could not finish signing you in. Please try again." };
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function setupAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = setupAccountSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const invite = await prisma.inviteToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: true },
  });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "This setup link is invalid or expired." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.session.deleteMany({ where: { userId: invite.userId } });
  await prisma.$transaction([
    prisma.user.update({
      where: { id: invite.userId },
      data: { passwordHash, isActive: true, mustChangePassword: false },
    }),
    prisma.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ]);
  await createSession(invite.userId);
  await logActivity({
    userId: invite.userId,
    action: `${invite.user.firstName} ${invite.user.lastName} set up their account`,
  });
  redirect("/workspace");
}
