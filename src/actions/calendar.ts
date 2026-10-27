"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CalendarEventType, TeamKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isFounder, requireTeam } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-path";
import { notifyMany } from "@/lib/activity";
import { monthKey, parseDateTimeLocal } from "@/lib/calendar-dates";

const EVENT_TYPES: CalendarEventType[] = [
  "TEAM_EVENT",
  "MEETING",
  "TASK_DEADLINE",
  "CONTENT_DEADLINE",
  "POSTING_DATE",
  "ANNOUNCEMENT",
  "APPLICATION",
];

function backPath(formData: FormData, role: string) {
  const next = safeNextPath(String(formData.get("next") || ""), role) ?? "/workspace/calendar";
  return next.split("?")[0];
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createEvent(formData: FormData) {
  const user = await requireTeam();
  const back = backPath(formData, user.role);
  if (user.role === "MEMBER") fail(back, "Only team leads can add calendar events.");
  const title = String(formData.get("title") || "").trim();
  const startAt = parseDateTimeLocal(String(formData.get("startAt") || ""));
  if (!title || !startAt) fail(back, "Add a title and a start time.");
  const teamKey = String(formData.get("teamKey") || "");
  const team =
    teamKey && (Object.values(TeamKey) as string[]).includes(teamKey)
      ? await prisma.team.findUnique({ where: { key: teamKey as TeamKey } })
      : null;
  if (teamKey && !team) fail(back, "That audience is not a team.");
  const typeRaw = String(formData.get("type") || "TEAM_EVENT");
  const type = EVENT_TYPES.includes(typeRaw as CalendarEventType)
    ? (typeRaw as CalendarEventType)
    : "TEAM_EVENT";
  const endAt = parseDateTimeLocal(String(formData.get("endAt") || ""));
  await prisma.calendarEvent.create({
    data: {
      title,
      description: String(formData.get("description") || "") || null,
      startAt,
      endAt,
      allDay: formData.get("allDay") === "on",
      type,
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
  await Promise.race([
    notifyMany(
      audience.map((m) => m.id),
      {
        title: "New calendar event",
        body: title,
        href: "/workspace/calendar",
      },
    ).catch((err) => console.error("[calendar:notify]", err)),
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);

  revalidatePath("/workspace/calendar");
  revalidatePath("/admin/calendar");
  revalidatePath("/workspace");
  const month = monthKey(startAt);
  redirect(back === "/workspace/calendar" ? `${back}?month=${month}&created=1` : `${back}?created=1`);
}

export async function deleteEvent(formData: FormData) {
  const user = await requireTeam();
  const next = safeNextPath(String(formData.get("next") || ""), user.role) ?? "/workspace/calendar";
  const [path, query = ""] = next.split("?");
  const month = new URLSearchParams(query).get("month");
  const stay = month && /^\d{4}-\d{2}$/.test(month) ? `${path}?month=${month}` : path;
  if (user.role === "MEMBER" && !isFounder(user)) fail(path, "You can't delete that event.");
  const id = String(formData.get("id") || "");
  const event = id ? await prisma.calendarEvent.findUnique({ where: { id } }) : null;
  if (!event) fail(path, "That event is already gone.");
  if (!isFounder(user) && event.createdById !== user.id && user.role !== "TEAM_ADMIN") {
    fail(path, "You can't delete that event.");
  }
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/workspace/calendar");
  revalidatePath("/admin/calendar");
  redirect(stay);
}
