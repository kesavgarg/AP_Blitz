"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CalendarEventType, TeamKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isFounder, requireTeam } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-path";
import { notifyMany } from "@/lib/activity";

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createEvent(formData: FormData) {
  const user = await requireTeam();
  if (user.role === "MEMBER") return;
  const title = String(formData.get("title") || "").trim();
  const startAt = parseDate(String(formData.get("startAt") || ""));
  if (!title || !startAt) return;
  const teamKey = String(formData.get("teamKey") || "") as TeamKey | "";
  const team = teamKey ? await prisma.team.findUnique({ where: { key: teamKey } }) : null;
  const endAt = parseDate(String(formData.get("endAt") || ""));
  await prisma.calendarEvent.create({
    data: {
      title,
      description: String(formData.get("description") || "") || null,
      startAt,
      endAt,
      allDay: formData.get("allDay") === "on",
      type: (String(formData.get("type") || "TEAM_EVENT") as CalendarEventType) || "TEAM_EVENT",
      teamId: team?.id ?? null,
      createdById: user.id,
    },
  });

  const audience = team
    ? await prisma.user.findMany({
        where: {
          isActive: true,
          id: { not: user.id },
          OR: [{ role: "FOUNDER" }, { memberships: { some: { teamId: team.id } } }],
        },
        select: { id: true },
      })
    : await prisma.user.findMany({
        where: { isActive: true, id: { not: user.id } },
        select: { id: true },
      });
  await notifyMany(
    audience.map((m) => m.id),
    {
      title: "New calendar event",
      body: title,
      href: "/workspace/calendar",
    },
  );

  revalidatePath("/workspace/calendar");
  revalidatePath("/admin/calendar");
  revalidatePath("/workspace");
  const next = safeNextPath(String(formData.get("next") || ""), user.role) ?? "/workspace/calendar";
  redirect(`${next.split("?")[0]}?created=1`);
}

export async function deleteEvent(formData: FormData) {
  const user = await requireTeam();
  if (user.role === "MEMBER" && !isFounder(user)) return;
  const id = String(formData.get("id") || "");
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) return;
  if (!isFounder(user) && event.createdById !== user.id && user.role !== "TEAM_ADMIN") {
    return;
  }
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/workspace/calendar");
  revalidatePath("/admin/calendar");
}
