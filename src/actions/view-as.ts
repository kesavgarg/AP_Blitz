"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireFounder } from "@/lib/auth";
import { VIEW_AS_COOKIE } from "@/lib/constants";

export async function viewAsMember(formData: FormData) {
  await requireFounder();
  const userId = String(formData.get("userId") || "");
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });
  if (!target || !target.isActive || target.role === "FOUNDER") return;
  const cookieStore = await cookies();
  cookieStore.set(VIEW_AS_COOKIE, target.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect(target.role === "BLITZER" ? "/student/dashboard" : "/workspace");
}

export async function stopViewingAs() {
  await requireFounder();
  const cookieStore = await cookies();
  cookieStore.delete(VIEW_AS_COOKIE);
  redirect("/admin/team");
}
