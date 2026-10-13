"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContentStatus, DesignRequestType, ScriptStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isFounder, leadsTeam, onTeam, requireUser } from "@/lib/auth";
import { logActivity, nextContentId, notify } from "@/lib/activity";
import { saveUpload } from "@/lib/files";
import { sendAssignment } from "@/lib/email";

function isNextRedirect(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest.startsWith("NEXT_REDIRECT")
  );
}

function scriptPath(opts: { id?: string; subject?: string; error?: string }) {
  const q = new URLSearchParams();
  if (opts.id) q.set("id", opts.id);
  if (opts.subject) q.set("subject", opts.subject);
  if (opts.error) q.set("error", opts.error);
  const query = q.toString();
  return query ? `/workspace/scripts?${query}` : "/workspace/scripts";
}

async function history(contentId: string, userId: string, action: string, from?: string, to?: string) {
  await prisma.contentHistory.create({
    data: { contentId, userId, action, fromStatus: from, toStatus: to },
  });
}

export async function submitSocialIdea(formData: FormData) {
  const user = await requireUser();
  if (!onTeam(user, "SOCIAL_MEDIA") && !isFounder(user)) {
    return;
  }
  const ideaTitle = String(formData.get("ideaTitle") || "").trim();
  if (!ideaTitle) return;
  const contentId = await nextContentId();
  const team = await prisma.team.findUnique({ where: { key: "SOCIAL_MEDIA" } });
  const item = await prisma.contentItem.create({
    data: {
      contentId,
      title: ideaTitle,
      status: "IDEA",
      ownerId: user.id,
      teamId: team?.id,
      apSubject: String(formData.get("apSubject") || "") || null,
      socialIdea: {
        create: {
          authorId: user.id,
          ideaTitle,
          platform: String(formData.get("platform") || "Instagram Reels"),
          trendLink: String(formData.get("trendLink") || "") || null,
          description: String(formData.get("description") || ""),
          whyItWorks: String(formData.get("whyItWorks") || "") || null,
          suggestedCaption: String(formData.get("suggestedCaption") || "") || null,
          suggestedFormat: String(formData.get("suggestedFormat") || "") || null,
        },
      },
    },
  });
  await history(item.id, user.id, `${user.firstName} submitted idea`, undefined, "IDEA");
  await logActivity({
    userId: user.id,
    action: `${user.firstName} ${user.lastName} submitted idea ${contentId}`,
    objectType: "ContentItem",
    objectId: contentId,
  });
  revalidatePath("/workspace/social");
  revalidatePath("/admin/content");
}

export async function approveIdea(formData: FormData) {
  const user = await requireUser();
  if (!isFounder(user) && user.role !== "TEAM_ADMIN") return;
  const id = String(formData.get("id") || "");
  const writerId = String(formData.get("writerId") || "") || null;
  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item) return;
  const writers = await prisma.team.findUnique({ where: { key: "SCRIPT_WRITER" } });
  await prisma.contentItem.update({
    where: { id },
    data: {
      status: "SCRIPT_IN_PROGRESS",
      ownerId: writerId,
      teamId: writers?.id,
    },
  });
  if (writerId) {
    await prisma.script.upsert({
      where: { contentItemId: id },
      update: { authorId: writerId },
      create: {
        contentItemId: id,
        authorId: writerId,
        title: item.title,
        apSubject: item.apSubject,
        apUnit: item.apUnit,
        status: "DRAFT",
      },
    });
    const writer = await prisma.user.findUnique({ where: { id: writerId } });
    if (writer) {
      await notify({
        userId: writer.id,
        title: "Script assigned",
        body: item.title,
        href: "/workspace/scripts",
      });
      await sendAssignment(writer.email, writer.firstName, item.title, "/workspace/scripts");
    }
  }
  await history(id, user.id, "Approved idea", item.status, "SCRIPT_IN_PROGRESS");
  revalidatePath("/admin/content");
  revalidatePath("/workspace/scripts");
  revalidatePath("/workspace/social");
}

export async function saveScript(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "");
  const apSubject = String(formData.get("apSubject") || "") || null;
  const apUnit = String(formData.get("apUnit") || "") || null;
  const submit = formData.get("submit") === "true";

  try {
    if (id) {
      const script = await prisma.script.findUnique({
        where: { id },
        include: { contentItem: true },
      });
      if (!script) {
        redirect(scriptPath({ error: "That script is gone.", subject: apSubject ?? undefined }));
      }
      if (script.authorId !== user.id && !isFounder(user) && !leadsTeam(user, "SCRIPT_WRITER")) {
        redirect(scriptPath({ id, subject: apSubject ?? undefined, error: "You cannot edit this script." }));
      }
      const status: ScriptStatus = submit ? "SUBMITTED" : script.status === "DRAFT" ? "DRAFT" : script.status;
      await prisma.script.update({
        where: { id },
        data: {
          title,
          body,
          apSubject,
          apUnit,
          status,
          submittedAt: submit ? new Date() : script.submittedAt,
        },
      });
      await prisma.contentItem.update({
        where: { id: script.contentItemId },
        data: {
          title,
          apSubject,
          apUnit,
          status: submit ? "SCRIPT_SUBMITTED" : script.contentItem.status,
        },
      });
      if (submit) {
        await history(script.contentItemId, user.id, "Submitted script", script.contentItem.status, "SCRIPT_SUBMITTED");
        await logActivity({
          userId: user.id,
          action: `${user.firstName} ${user.lastName} submitted Script ${script.contentItem.contentId}`,
          objectType: "Script",
          objectId: script.contentItem.contentId,
        });
      }
      revalidatePath("/workspace/scripts");
      revalidatePath("/admin/content");
      redirect(scriptPath({ id, subject: apSubject ?? undefined }));
    }

    if (!onTeam(user, "SCRIPT_WRITER") && !isFounder(user)) {
      redirect(scriptPath({ error: "You need the Script Writer role to create scripts." }));
    }
    const contentId = await nextContentId();
    const team = await prisma.team.findUnique({ where: { key: "SCRIPT_WRITER" } });
    const item = await prisma.contentItem.create({
      data: {
        contentId,
        title: title || "Untitled script",
        apSubject,
        apUnit,
        status: submit ? "SCRIPT_SUBMITTED" : "SCRIPT_IN_PROGRESS",
        ownerId: user.id,
        teamId: team?.id,
        script: {
          create: {
            authorId: user.id,
            title: title || "Untitled script",
            body,
            apSubject,
            apUnit,
            status: submit ? "SUBMITTED" : "DRAFT",
            submittedAt: submit ? new Date() : null,
          },
        },
      },
    });
    await history(item.id, user.id, submit ? "Created and submitted script" : "Created script draft");
    const created = await prisma.script.findUnique({ where: { contentItemId: item.id } });
    revalidatePath("/workspace/scripts");
    revalidatePath("/admin/content");
    redirect(scriptPath({ id: created?.id, subject: apSubject ?? undefined }));
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    console.error("[saveScript]", err);
    redirect(
      scriptPath({
        id: id || undefined,
        subject: apSubject ?? undefined,
        error: err instanceof Error ? err.message : "Could not save that script.",
      }),
    );
  }
}

export async function deleteScript(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  try {
    const script = await prisma.script.findUnique({
      where: { id },
      include: { contentItem: { include: { video: true, socialIdea: true } } },
    });
    if (!script) {
      redirect(scriptPath({ error: "That script is already gone." }));
    }
    if (script.authorId !== user.id && !isFounder(user) && !leadsTeam(user, "SCRIPT_WRITER")) {
      redirect(scriptPath({ id, subject: script.apSubject ?? undefined, error: "You cannot delete this script." }));
    }
    const subject = script.apSubject ?? "";
    await prisma.script.delete({ where: { id } });
    if (!script.contentItem.video && !script.contentItem.socialIdea) {
      await prisma.contentItem.delete({ where: { id: script.contentItemId } }).catch(() => undefined);
    }
    await logActivity({
      userId: user.id,
      action: `${user.firstName} deleted script ${script.title}`,
      objectType: "Script",
      objectId: id,
    });
    revalidatePath("/workspace/scripts");
    revalidatePath("/admin/content");
    redirect(scriptPath({ subject: subject || undefined }));
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    console.error("[deleteScript]", err);
    redirect(scriptPath({ id, error: err instanceof Error ? err.message : "Could not delete that script." }));
  }
}

export async function reviewScript(formData: FormData) {
  const user = await requireUser();
  if (!isFounder(user) && !leadsTeam(user, "SCRIPT_WRITER")) return;
  const id = String(formData.get("id") || "");
  const decision = String(formData.get("decision") || "");
  const creatorId = String(formData.get("creatorId") || "") || null;
  const script = await prisma.script.findUnique({
    where: { id },
    include: { contentItem: true },
  });
  if (!script) return;
  if (decision === "revise") {
    await prisma.script.update({ where: { id }, data: { status: "NEEDS_REVISION" } });
    await prisma.contentItem.update({
      where: { id: script.contentItemId },
      data: { status: "SCRIPT_NEEDS_REVISION" },
    });
    await notify({
      userId: script.authorId,
      title: "Script needs revision",
      body: script.title,
      href: "/workspace/scripts",
    });
    await history(script.contentItemId, user.id, "Requested script revision", script.contentItem.status, "SCRIPT_NEEDS_REVISION");
  } else {
    await prisma.script.update({ where: { id }, data: { status: "APPROVED" } });
    const videoTeam = await prisma.team.findUnique({ where: { key: "VIDEO_CREATOR" } });
    await prisma.contentItem.update({
      where: { id: script.contentItemId },
      data: {
        status: creatorId ? "VIDEO_ASSIGNED" : "SCRIPT_APPROVED",
        ownerId: creatorId ?? script.contentItem.ownerId,
        teamId: videoTeam?.id ?? script.contentItem.teamId,
      },
    });
    if (creatorId) {
      await prisma.video.upsert({
        where: { contentItemId: script.contentItemId },
        update: { creatorId, creatorStatus: "assigned", assignedAt: new Date() },
        create: {
          contentItemId: script.contentItemId,
          creatorId,
          creatorStatus: "assigned",
          assignedAt: new Date(),
        },
      });
      await prisma.script.update({ where: { id }, data: { status: "ASSIGNED" } });
      const creator = await prisma.user.findUnique({ where: { id: creatorId } });
      if (creator) {
        await notify({
          userId: creator.id,
          title: "Script assigned to you",
          body: script.title,
          href: "/workspace/video",
        });
        await sendAssignment(creator.email, creator.firstName, script.title, "/workspace/video");
      }
    }
    await history(script.contentItemId, user.id, "Approved script", script.contentItem.status, creatorId ? "VIDEO_ASSIGNED" : "SCRIPT_APPROVED");
  }
  revalidatePath("/workspace/scripts");
  revalidatePath("/workspace/video");
  revalidatePath("/admin/content");
}

export async function acceptVideoAssignment(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const video = await prisma.video.findUnique({
    where: { id },
    include: { contentItem: true },
  });
  if (!video || (video.creatorId !== user.id && !isFounder(user))) {
    return;
  }
  await prisma.video.update({ where: { id }, data: { creatorStatus: "accepted" } });
  await prisma.contentItem.update({
    where: { id: video.contentItemId },
    data: { status: "VIDEO_IN_PROGRESS" },
  });
  await history(video.contentItemId, user.id, "Accepted video assignment", video.contentItem.status, "VIDEO_IN_PROGRESS");
  revalidatePath("/workspace/video");
}

export async function submitRawVideo(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const notes = String(formData.get("notes") || "") || null;
  const file = formData.get("file");
  const video = await prisma.video.findUnique({
    where: { id },
    include: { contentItem: true },
  });
  if (!video || (video.creatorId !== user.id && !isFounder(user))) {
    return;
  }
  let rawFileId = video.rawFileId;
  if (file instanceof File && file.size > 0) {
    const saved = await saveUpload(file, user.id, { contentItemId: video.contentItemId });
    rawFileId = saved.id;
  }
  const editors = await prisma.team.findUnique({ where: { key: "VIDEO_EDITOR" } });
  await prisma.video.update({
    where: { id },
    data: { creatorNotes: notes, rawFileId, creatorStatus: "submitted", editorStatus: "waiting" },
  });
  await prisma.contentItem.update({
    where: { id: video.contentItemId },
    data: { status: "WAITING_FOR_EDITOR", teamId: editors?.id, ownerId: video.editorId ?? video.creatorId },
  });
  await history(video.contentItemId, user.id, "Submitted raw video", video.contentItem.status, "WAITING_FOR_EDITOR");
  await logActivity({
    userId: user.id,
    action: `${user.firstName} submitted video ${video.contentItem.contentId}`,
    objectType: "Video",
    objectId: video.contentItem.contentId,
  });
  revalidatePath("/workspace/video");
  revalidatePath("/workspace/edit");
}

export async function claimEdit(formData: FormData) {
  const user = await requireUser();
  if (!onTeam(user, "VIDEO_EDITOR") && !isFounder(user)) return;
  const id = String(formData.get("id") || "");
  const video = await prisma.video.findUnique({
    where: { id },
    include: { contentItem: true },
  });
  if (!video) return;
  await prisma.video.update({
    where: { id },
    data: { editorId: user.id, editorStatus: "editing" },
  });
  await prisma.contentItem.update({
    where: { id: video.contentItemId },
    data: { status: "EDITING", ownerId: user.id },
  });
  await history(video.contentItemId, user.id, "Accepted video for editing", video.contentItem.status, "EDITING");
  revalidatePath("/workspace/edit");
}

export async function submitEdit(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const notes = String(formData.get("notes") || "") || null;
  const file = formData.get("file");
  const video = await prisma.video.findUnique({
    where: { id },
    include: { contentItem: true },
  });
  if (!video || (video.editorId !== user.id && !isFounder(user))) {
    return;
  }
  let editedFileId = video.editedFileId;
  if (file instanceof File && file.size > 0) {
    const saved = await saveUpload(file, user.id, { contentItemId: video.contentItemId });
    editedFileId = saved.id;
  }
  await prisma.video.update({
    where: { id },
    data: { editorNotes: notes, editedFileId, editorStatus: "submitted" },
  });
  await prisma.contentItem.update({
    where: { id: video.contentItemId },
    data: { status: "EDIT_SUBMITTED" },
  });
  await history(video.contentItemId, user.id, "Submitted edited video", video.contentItem.status, "EDIT_SUBMITTED");
  revalidatePath("/workspace/edit");
  revalidatePath("/admin/content");
}

export async function reviewEdit(formData: FormData) {
  const user = await requireUser();
  if (!isFounder(user) && !leadsTeam(user, "VIDEO_EDITOR")) return;
  const id = String(formData.get("id") || "");
  const decision = String(formData.get("decision") || "");
  const video = await prisma.video.findUnique({
    where: { id },
    include: { contentItem: true },
  });
  if (!video) return;
  if (decision === "revise") {
    await prisma.video.update({ where: { id }, data: { editorStatus: "needs_revision" } });
    await prisma.contentItem.update({
      where: { id: video.contentItemId },
      data: { status: "EDIT_NEEDS_REVISION" },
    });
    if (video.editorId) {
      await notify({
        userId: video.editorId,
        title: "Edit needs revision",
        body: video.contentItem.title,
        href: "/workspace/edit",
      });
    }
    await history(video.contentItemId, user.id, "Requested edit revision", video.contentItem.status, "EDIT_NEEDS_REVISION");
  } else {
    await prisma.video.update({ where: { id }, data: { editorStatus: "approved" } });
    await prisma.contentItem.update({
      where: { id: video.contentItemId },
      data: { status: "GRAPHICS" },
    });
    await history(video.contentItemId, user.id, "Approved edit", video.contentItem.status, "GRAPHICS");
  }
  revalidatePath("/admin/content");
  revalidatePath("/workspace/edit");
}

export async function createDesignRequest(formData: FormData) {
  const user = await requireUser();
  if (
    user.role === "MEMBER" &&
    !onTeam(user, "GRAPHIC_DESIGN") &&
    !onTeam(user, "SOCIAL_MEDIA")
  ) {
    return;
  }
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const team = await prisma.team.findUnique({ where: { key: "GRAPHIC_DESIGN" } });
  const contentItemId = String(formData.get("contentItemId") || "") || null;
  const deadlineRaw = String(formData.get("deadline") || "");
  await prisma.designRequest.create({
    data: {
      title,
      description: String(formData.get("description") || ""),
      type: (String(formData.get("type") || "INSTAGRAM_POST") as DesignRequestType) || "INSTAGRAM_POST",
      dimensions: String(formData.get("dimensions") || "") || null,
      referenceUrl: String(formData.get("referenceUrl") || "") || null,
      contentItemId,
      teamId: team?.id,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
      assigneeId: String(formData.get("assigneeId") || "") || null,
    },
  });
  revalidatePath("/workspace/design");
}

export async function submitDesign(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const req = await prisma.designRequest.findUnique({ where: { id } });
  if (!req) return;
  if (!onTeam(user, "GRAPHIC_DESIGN") && !isFounder(user)) return;
  const file = formData.get("file");
  const canvaLink = String(formData.get("canvaLink") || "") || null;
  if (file instanceof File && file.size > 0) {
    await saveUpload(file, user.id, { designRequestId: id, contentItemId: req.contentItemId ?? undefined });
  }
  await prisma.designRequest.update({
    where: { id },
    data: { canvaLink, status: "submitted", assigneeId: req.assigneeId ?? user.id },
  });
  await logActivity({
    userId: user.id,
    action: `${user.firstName} uploaded Design ${id.slice(0, 8)}`,
    objectType: "DesignRequest",
    objectId: id,
  });
  revalidatePath("/workspace/design");
  revalidatePath("/admin/content");
}

export async function advanceContent(formData: FormData) {
  const user = await requireUser();
  if (!isFounder(user) && user.role !== "TEAM_ADMIN") return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ContentStatus;
  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item) return;
  const publishAt = String(formData.get("publishAt") || "");
  const { stageFromStatus } = await import("@/lib/stages");
  const stage = stageFromStatus(status);
  await prisma.contentItem.update({
    where: { id },
    data: {
      status,
      stage,
      publishAt: publishAt ? new Date(publishAt) : item.publishAt,
      completedAt: stage === "COMPLETED" ? new Date() : null,
      completedById: stage === "COMPLETED" ? user.id : null,
    },
  });
  if (status === "PUBLISHED" && publishAt) {
    await prisma.calendarEvent.create({
      data: {
        title: `Post: ${item.title}`,
        description: `Content ${item.contentId} publishing`,
        startAt: new Date(publishAt),
        type: "POSTING_DATE",
        contentItemId: item.id,
        createdById: user.id,
      },
    });
  }
  await history(id, user.id, `Moved to ${status}`, item.status, status);
  await logActivity({
    userId: user.id,
    action: `${user.firstName} moved ${item.contentId} to ${status}`,
    objectType: "ContentItem",
    objectId: item.contentId,
  });
  revalidatePath("/admin/content");
  revalidatePath(`/workspace/content/${id}`);
}
