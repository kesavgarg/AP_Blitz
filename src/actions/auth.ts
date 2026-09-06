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

export type ActionState = { error?: string; success?: string } | undefined;

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = clientIp((await headers()) as Headers);
  const limited = rateLimit(`login:${ip}`, 8, 10 * 60 * 1000);
  if (!limited.ok) return { error: "Too many login attempts. Wait a few minutes." };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  if (!authSecret()) {
    console.error("[login] AUTH_SECRET is not set");
    return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }

  const email = parsed.data.email.toLowerCase();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !user.isActive) {
      return { error: "Those credentials don't match an active AP Blitz account." };
    }
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return { error: "Those credentials don't match an active AP Blitz account." };

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await createSession(user.id);
    await logActivity({ userId: user.id, action: `${user.firstName} ${user.lastName} logged in` });

    const next = String(formData.get("next") || "");
    const dest = next.startsWith("/") && !next.startsWith("//") ? next : user.role === "FOUNDER" ? "/admin" : "/workspace";
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
