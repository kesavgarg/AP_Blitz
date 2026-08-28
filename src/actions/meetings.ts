"use server";

import { revalidatePath } from "next/cache";
import { TeamKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isFounder, requireUser } from "@/lib/auth";
import { notify, logActivity } from "@/lib/activity";
import { sendMeetingInvite } from "@/lib/email";
import { formatDateTime } from "@/lib/utils";

export async function createMeeting(formData: FormData) {
  const user = await requireUser();
  if (user.role === "MEMBER") return;
  const title = String(formData.get("title") || "").trim();
  const meetingLink = String(formData.get("meetingLink") || "").trim();
  const startAt = String(formData.get("startAt") || "");
  if (!title || !meetingLink || !startAt) return;
  const teamKey = String(formData.get("teamKey") || "") as TeamKey | "";
  const team = teamKey ? await prisma.team.findUnique({ where: { key: teamKey } }) : null;
  const attendeeIds = formData.getAll("attendeeIds").map(String).filter(Boolean);

  const meeting = await prisma.meeting.create({
    data: {
      title,
      description: String(formData.get("description") || "") || null,
      startAt: new Date(startAt),
      endAt: formData.get("endAt") ? new Date(String(formData.get("endAt"))) : null,
      meetingLink,
      teamId: team?.id,
      hostId: user.id,
      attendees: {
        create: [
          { userId: user.id, required: true },
          ...attendeeIds
            .filter((id) => id !== user.id)
            .map((id) => ({ userId: id, required: true })),
        ],
      },
    },
    include: { attendees: { include: { user: true } } },
  });

  await prisma.calendarEvent.create({
    data: {
      title,
      description: String(formData.get("description") || "") || null,
      startAt: meeting.startAt,
      endAt: meeting.endAt,
      type: "MEETING",
      teamId: team?.id,
      meetingId: meeting.id,
      createdById: user.id,
    },
  });

  for (const a of meeting.attendees) {
    if (a.userId === user.id) continue;
    await notify({
      userId: a.userId,
      title: "Meeting invite",
      body: title,
      href: "/workspace/meetings",
    });
    await sendMeetingInvite(
      a.user.email,
      a.user.firstName,
      title,
      formatDateTime(meeting.startAt),
      meetingLink,
    );
  }
  await logActivity({
    userId: user.id,
    action: `${user.firstName} created meeting "${title}"`,
    objectType: "Meeting",
    objectId: meeting.id,
  });
  revalidatePath("/workspace/meetings");
  revalidatePath("/workspace/calendar");
}

export async function createAnnouncement(formData: FormData) {
  const user = await requireUser();
  if (!isFounder(user) && user.role !== "TEAM_ADMIN") return;
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title || !body) return;
  await prisma.announcement.create({
    data: { title, body, authorId: user.id, pinned: formData.get("pinned") === "on" },
  });
  const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title: "New announcement",
      body: title,
      href: "/workspace",
    })),
  });
  revalidatePath("/workspace");
  revalidatePath("/admin");
}
