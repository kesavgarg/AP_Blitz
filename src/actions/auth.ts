"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
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

  const email = parsed.data.email.toLowerCase();
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
  if (user.role === "FOUNDER") {
    redirect(next.startsWith("/") ? next : "/admin");
  }
  redirect(next.startsWith("/") ? next : "/workspace");
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
      data: { passwordHash, isActive: true },
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
