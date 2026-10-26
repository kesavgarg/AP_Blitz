import "server-only";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, VIEW_AS_COOKIE } from "@/lib/constants";
import { AUTH_SECRET } from "@/lib/env";
import type { PermissionRole, TeamKey } from "@prisma/client";
const SESSION_DAYS = 14;

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: PermissionRole;
  isActive: boolean;
  mustChangePassword: boolean;
  teams: { key: TeamKey; name: string; isLeader: boolean }[];
  viewingAs?: boolean;
};

export function authSecret() {
  return AUTH_SECRET.trim();
}

function secret() {
  const value = authSecret();
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function revokeUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const { headers } = await import("next/headers");
    const { clientIp } = await import("@/lib/rate-limit");
    const h = await headers();
    ip = clientIp(h);
    userAgent = (h.get("user-agent") || "").slice(0, 400) || null;
  } catch {
    // Session still works when headers are unavailable.
  }
  await prisma.session.create({
    data: { userId, token, expiresAt, ip, userAgent },
  });
  const jwt = await new SignJWT({ sid: token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(SESSION_COOKIE)?.value;
  if (jwt) {
    try {
      const { payload } = await jwtVerify(jwt, secret());
      if (typeof payload.sid === "string") {
        await prisma.session.deleteMany({ where: { token: payload.sid } });
      }
    } catch {
      // ignore invalid tokens
    }
  }
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(VIEW_AS_COOKIE);
}

type DbAccount = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: PermissionRole;
  isActive: boolean;
  mustChangePassword: boolean;
  memberships: { isLeader: boolean; team: { key: TeamKey; name: string } }[];
};

function toSessionUser(user: DbAccount, viewingAs = false): SessionUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    teams: user.memberships.map((membership) => ({
      key: membership.team.key,
      name: membership.team.name,
      isLeader: membership.isLeader,
    })),
    viewingAs,
  };
}

const accountInclude = { memberships: { include: { team: true } } } as const;

export const getRealSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, secret());
    if (typeof payload.sid !== "string") return null;
    const session = await prisma.session.findUnique({
      where: { token: payload.sid },
      include: { user: { include: accountInclude } },
    });
    if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
    return toSessionUser(session.user);
  } catch {
    return null;
  }
});

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const real = await getRealSessionUser();
  if (!real || real.role !== "FOUNDER") return real;
  const viewAs = (await cookies()).get(VIEW_AS_COOKIE)?.value;
  if (!viewAs || viewAs === real.id) return real;
  const target = await prisma.user.findUnique({
    where: { id: viewAs },
    include: accountInclude,
  });
  if (!target || !target.isActive || target.role === "FOUNDER") return real;
  return toSessionUser(target, true);
});

export async function getViewingAsLabel() {
  const real = await getRealSessionUser();
  if (!real || real.role !== "FOUNDER") return null;
  const current = await getSessionUser();
  if (!current?.viewingAs) return null;
  return {
    name: `${current.firstName} ${current.lastName}`,
    href: current.role === "BLITZER" ? "/student/dashboard" : "/workspace",
  };
}

export async function requireRealUser() {
  const user = await getRealSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Signed-in team account. Blitzer accounts stay on the student side. */
export async function requireTeam() {
  const user = await requireUser();
  if (user.role === "BLITZER") redirect("/student/dashboard");
  return user;
}

export async function requireFounder() {
  const user = await requireRealUser();
  if (user.role !== "FOUNDER") redirect("/workspace");
  return user;
}

export async function requireAdmin() {
  const user = await requireRealUser();
  if (user.role !== "FOUNDER" && user.role !== "TEAM_ADMIN") {
    redirect("/workspace");
  }
  return user;
}

export function isFounder(user: SessionUser) {
  return user.role === "FOUNDER";
}

export function isAdmin(user: SessionUser) {
  return user.role === "FOUNDER" || user.role === "TEAM_ADMIN";
}

export function leadsTeam(user: SessionUser, key: TeamKey) {
  return isFounder(user) || user.teams.some((t) => t.key === key && t.isLeader);
}

export function onTeam(user: SessionUser, key: TeamKey) {
  return isFounder(user) || user.teams.some((t) => t.key === key);
}

export function teamKeys(user: SessionUser) {
  return user.teams.map((t) => t.key);
}
