"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin, requireUser } from "@/lib/auth";
import { logActivity, notify } from "@/lib/activity";
import { detectPlatform, parseDuration, parseTimestamp, videoUrlKey } from "@/lib/videos";
import { cookies } from "next/headers";

async function requireStaff() {
  const user = await requireUser();
  if (user.role === "BLITZER") return null;
  return user;
}

function revalidateVideo(id?: string) {
  revalidatePath("/workspace/videos");
  revalidatePath("/videos");
  revalidatePath("/admin/content");
  if (id) {
    revalidatePath(`/workspace/videos/${id}`);
    revalidatePath(`/videos/watch/${id}`);
  }
}

export async function saveLibraryVideo(formData: FormData) {
  const user = await requireStaff();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const subjectId = String(formData.get("subjectId") || "");
  const description = String(formData.get("description") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();
  const tags = String(formData.get("tags") || "").trim();
  const ownerId = String(formData.get("ownerId") || "") || null;
  const deadlineRaw = String(formData.get("deadline") || "");
  const contentItemId = String(formData.get("contentItemId") || "") || null;
  const intent = String(formData.get("intent") || "save");
  const forceDuplicate = formData.get("forceDuplicate") === "on";

  const back = id ? `/workspace/videos/${id}` : "/workspace/videos";
  if (!title || !url || !subjectId) redirect(`${back}?error=${encodeURIComponent("Title, video URL, and AP subject are required.")}`);
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    redirect(`${back}?error=${encodeURIComponent("That video URL is not valid.")}`);
  }
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    redirect(`${back}?error=${encodeURIComponent("Use an http or https video URL.")}`);
  }
  const subject = await prisma.apSubject.findFirst({ where: { id: subjectId, active: true } });
  if (!subject) redirect(`${back}?error=${encodeURIComponent("Pick a subject from the list. AP Blitz will not guess.")}`);

  const publish = intent === "publish";
  if (publish && !isAdmin(user)) return;

  const platform = detectPlatform(url);
  const durationSeconds = parseDuration(String(formData.get("duration") || ""));
  if (String(formData.get("duration") || "").trim() && durationSeconds == null) {
    redirect(`${back}?error=${encodeURIComponent("Duration must look like 1:40 or 1:03:10.")}`);
  }
  const baseKey = videoUrlKey(url);
  const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
  if (deadlineRaw && deadline && Number.isNaN(deadline.getTime())) return;

  const data = {
    title: title.slice(0, 180),
    description: description.slice(0, 4000),
    unit: unit ? unit.slice(0, 160) : null,
    url,
    thumbnailUrl: thumbnailUrl || null,
    durationSeconds,
    platform,
    tags: tags ? tags.slice(0, 400) : null,
    subjectId: subject.id,
    ownerId,
    deadline,
    contentItemId,
    promotional: formData.get("promotional") === "on",
  };

  let videoId = id;
  const existingByUrl = await prisma.libraryVideo.findUnique({ where: { urlKey: baseKey } });

  if (!id) {
    if (existingByUrl && !forceDuplicate) {
      videoId = existingByUrl.id;
      await prisma.libraryVideo.update({ where: { id: videoId }, data });
      await prisma.videoEvent.create({
        data: { videoId, userId: user.id, action: "Updated existing video from the same URL" },
      });
    } else {
      const urlKey = existingByUrl && forceDuplicate ? `${baseKey}:dup:${crypto.randomUUID()}` : baseKey;
      const created = await prisma.libraryVideo.create({
        data: { ...data, urlKey, status: "DRAFT" },
      });
      videoId = created.id;
      await prisma.videoEvent.create({
        data: { videoId, userId: user.id, action: "Created draft" },
      });
    }
  } else {
    const current = await prisma.libraryVideo.findUnique({ where: { id } });
    if (!current) return;
    let urlKey = current.urlKey;
    if (existingByUrl && existingByUrl.id !== id) {
      if (!forceDuplicate) {
        await prisma.libraryVideo.update({ where: { id: existingByUrl.id }, data });
        videoId = existingByUrl.id;
        await prisma.videoEvent.create({
          data: { videoId, userId: user.id, action: "Merged into the existing URL" },
        });
      } else {
        urlKey = `${baseKey}:dup:${id}`;
      }
    } else {
      urlKey = baseKey;
    }
    if (videoId === id) {
      await prisma.libraryVideo.update({ where: { id }, data: { ...data, urlKey } });
      await prisma.videoEvent.create({
        data: { videoId: id, userId: user.id, action: "Saved changes" },
      });
    }
  }

  if (publish && videoId) {
    const current = await prisma.libraryVideo.findUnique({ where: { id: videoId } });
    const wasPublished = current?.status === "PUBLISHED";
    await prisma.libraryVideo.update({
      where: { id: videoId },
      data: {
        status: "PUBLISHED",
        publishedAt: current?.publishedAt ?? new Date(),
        publishedById: user.id,
      },
    });
    await prisma.videoEvent.create({
      data: { videoId, userId: user.id, action: wasPublished ? "Updated published video" : "Published" },
    });
    if (!wasPublished) {
      await notifyPublishedVideo(videoId);
    }
    await logActivity({
      userId: user.id,
      action: `${user.firstName} published “${title}” in ${subject.name}`,
      objectType: "LibraryVideo",
      objectId: videoId,
    });
  }

  revalidateVideo(videoId);
  revalidatePath(`/videos/${subject.slug}`);
  if (publish) redirect("/workspace/videos?published=1");
  redirect(`/workspace/videos/${videoId}?saved=1`);
}

async function notifyPublishedVideo(videoId: string) {
  const video = await prisma.libraryVideo.findUnique({
    where: { id: videoId },
    include: { subject: true },
  });
  if (!video || video.status !== "PUBLISHED") return;
  const blitzers = await prisma.user.findMany({
    where: { role: "BLITZER", isActive: true },
    include: {
      notificationPreference: true,
      classes: { select: { subjectId: true } },
    },
  });
  for (const person of blitzers) {
    const pref = person.notificationPreference;
    const wantsAll = !pref || pref.newVideos;
    const enrolled = person.classes.some((row) => row.subjectId === video.subjectId);
    const wantsSubject = (!pref || pref.subjectVideos) && enrolled;
    if (!wantsAll && !wantsSubject) continue;
    await notify({
      userId: person.id,
      title: `New ${video.subject.name} video`,
      body: video.title,
      href: `/videos/watch/${video.id}`,
      kind: wantsAll ? "newVideos" : "subjectVideos",
      dedupeKey: `video-published:${video.id}`,
    });
  }
}

export async function unpublishLibraryVideo(formData: FormData) {
  const user = await requireUser();
  if (!isAdmin(user)) return;
  const id = String(formData.get("id") || "");
  const video = await prisma.libraryVideo.findUnique({ where: { id }, include: { subject: true } });
  if (!video) return;
  await prisma.libraryVideo.update({
    where: { id },
    data: { status: "DRAFT" },
  });
  await prisma.videoEvent.create({
    data: { videoId: id, userId: user.id, action: "Unpublished" },
  });
  revalidateVideo(id);
  revalidatePath(`/videos/${video.subject.slug}`);
}

export async function addChapterAction(formData: FormData) {
  const user = await requireStaff();
  if (!user) return;
  const videoId = String(formData.get("videoId") || "");
  const label = String(formData.get("label") || "").trim();
  const seconds = parseTimestamp(String(formData.get("time") || ""));
  if (!videoId || !label || seconds == null) {
    if (videoId) redirect(`/workspace/videos/${videoId}?error=${encodeURIComponent("Use a label and a timestamp like 1:40 or 1:03:10.")}`);
    return;
  }
  const video = await prisma.libraryVideo.findUnique({ where: { id: videoId } });
  if (!video) return;
  const last = await prisma.videoChapter.findFirst({
    where: { videoId },
    orderBy: { sortOrder: "desc" },
  });
  await prisma.videoChapter.create({
    data: { videoId, label: label.slice(0, 120), seconds, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  revalidateVideo(videoId);
}

export async function updateChapterAction(formData: FormData) {
  const user = await requireStaff();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const label = String(formData.get("label") || "").trim();
  const seconds = parseTimestamp(String(formData.get("time") || ""));
  const chapter = id ? await prisma.videoChapter.findUnique({ where: { id } }) : null;
  if (!id || !label || seconds == null || !chapter) {
    if (chapter) redirect(`/workspace/videos/${chapter.videoId}?error=${encodeURIComponent("Use a label and a timestamp like 1:40 or 1:03:10.")}`);
    return;
  }
  await prisma.videoChapter.update({
    where: { id },
    data: { label: label.slice(0, 120), seconds },
  });
  revalidateVideo(chapter.videoId);
}

export async function deleteChapterAction(formData: FormData) {
  const user = await requireStaff();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const chapter = await prisma.videoChapter.findUnique({ where: { id } });
  if (!chapter) return;
  await prisma.videoChapter.delete({ where: { id } });
  revalidateVideo(chapter.videoId);
}

export async function moveChapterAction(formData: FormData) {
  const user = await requireStaff();
  if (!user) return;
  const id = String(formData.get("id") || "");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const chapter = await prisma.videoChapter.findUnique({ where: { id } });
  if (!chapter) return;
  const siblings = await prisma.videoChapter.findMany({
    where: { videoId: chapter.videoId },
    orderBy: [{ sortOrder: "asc" }, { seconds: "asc" }],
  });
  const index = siblings.findIndex((row) => row.id === id);
  const swap = siblings[index + direction];
  if (!swap) return;
  await prisma.$transaction([
    prisma.videoChapter.update({ where: { id: chapter.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.videoChapter.update({ where: { id: swap.id }, data: { sortOrder: chapter.sortOrder } }),
  ]);
  revalidateVideo(chapter.videoId);
}

export async function recordViewAction(videoId: string) {
  if (!videoId) return;
  const jar = await cookies();
  const key = `apblitz_view_${videoId}`;
  if (jar.get(key)) return;
  const video = await prisma.libraryVideo.findFirst({ where: { id: videoId, status: "PUBLISHED" } });
  if (!video) return;
  await prisma.libraryVideo.update({
    where: { id: videoId },
    data: { viewCount: { increment: 1 } },
  });
  jar.set(key, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}

export async function recordProgressAction(videoId: string, seconds: number) {
  const user = await getSessionUser();
  if (!user || user.role !== "BLITZER") return;
  if (!Number.isFinite(seconds) || seconds < 0) return;
  const video = await prisma.libraryVideo.findFirst({ where: { id: videoId, status: "PUBLISHED" } });
  if (!video) return;
  await prisma.watchProgress.upsert({
    where: { userId_videoId: { userId: user.id, videoId } },
    update: { positionSeconds: Math.floor(seconds) },
    create: { userId: user.id, videoId, positionSeconds: Math.floor(seconds) },
  });
  revalidatePath("/student/dashboard");
  revalidatePath("/videos");
}

export async function setRequestStatusAction(formData: FormData) {
  const user = await requireUser();
  if (!isAdmin(user)) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!["NEW", "PLANNED", "COMPLETED", "DECLINED"].includes(status)) return;
  const videoId = String(formData.get("videoId") || "") || null;
  const request = await prisma.videoRequest.findUnique({ where: { id }, include: { subject: true } });
  if (!request) return;
  let linked: string | null = null;
  if (videoId) {
    const video = await prisma.libraryVideo.findFirst({ where: { id: videoId, status: "PUBLISHED" } });
    if (!video) return;
    linked = video.id;
  }
  await prisma.videoRequest.update({
    where: { id },
    data: { status: status as "NEW" | "PLANNED" | "COMPLETED" | "DECLINED", videoId: linked },
  });
  await notify({
    userId: request.userId,
    title: "Your video request was updated",
    body: `${request.subject.name} · ${request.unit} is now ${status.toLowerCase().replaceAll("_", " ")}.`,
    href: "/student/requests",
    kind: "requestUpdates",
    dedupeKey: `request:${id}:${status}:${linked ?? "none"}`,
  });
  revalidatePath("/admin/requests");
  revalidatePath("/student/requests");
}
