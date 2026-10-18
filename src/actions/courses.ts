"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin, onTeam, requireTeam } from "@/lib/auth";
import { writtenPrompts } from "@/lib/course-responses";
import { SUBJECTS } from "@/lib/subjects";
import { ensureFiveForFive } from "@/lib/teams";

function refresh(courseId?: string) {
  revalidatePath("/workspace/five");
  if (courseId) revalidatePath(`/workspace/five/${courseId}`);
}

function httpsUrl(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

async function editor() {
  const user = await requireTeam();
  if (!onTeam(user, "FIVE_FOR_FIVE") && !isAdmin(user)) return null;
  return user;
}

async function ownedCourse(userId: string, courseId: string, admin: boolean) {
  return prisma.courseDoc.findFirst({
    where: { id: courseId, ...(admin ? {} : { ownerId: userId }) },
    select: { id: true, subjectSlug: true, ownerId: true },
  });
}

export async function createCourseDoc(formData: FormData) {
  const user = await editor();
  if (!user) return;
  const subject = SUBJECTS.find((item) => item.slug === String(formData.get("subject") || ""));
  const docUrl = httpsUrl(String(formData.get("docUrl") || ""));
  if (!subject || !docUrl) return;
  await ensureFiveForFive();
  const doc = await prisma.courseDoc.create({
    data: {
      subjectSlug: subject.slug,
      title: subject.name,
      docUrl,
      ownerId: user.id,
    },
  });
  refresh(doc.id);
  redirect(`/workspace/five/${doc.id}`);
}

export async function addCourseUnit(formData: FormData) {
  const user = await editor();
  if (!user) return;
  const courseId = String(formData.get("courseId") || "");
  const title = String(formData.get("title") || "").trim().slice(0, 120);
  if (!courseId || !title) return;
  const course = await ownedCourse(user.id, courseId, isAdmin(user));
  if (!course) return;
  const last = await prisma.courseUnit.findFirst({
    where: { courseId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const unit = await prisma.courseUnit.create({
    data: {
      courseId,
      title,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      prompts: {
        create: writtenPrompts(course.subjectSlug).map((prompt) => ({ kind: prompt.kind })),
      },
    },
  });
  refresh(courseId);
  redirect(`/workspace/five/${courseId}?unit=${unit.id}`);
}

export async function addCourseTopic(formData: FormData) {
  const user = await editor();
  if (!user) return;
  const unitId = String(formData.get("unitId") || "");
  const title = String(formData.get("title") || "").trim().slice(0, 160);
  if (!unitId || !title) return;
  const unit = await prisma.courseUnit.findUnique({
    where: { id: unitId },
    select: { id: true, courseId: true, course: { select: { ownerId: true } } },
  });
  if (!unit || (!isAdmin(user) && unit.course.ownerId !== user.id)) return;
  const last = await prisma.courseTopic.findFirst({
    where: { unitId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  await prisma.courseTopic.create({
    data: { unitId, title, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  refresh(unit.courseId);
  redirect(`/workspace/five/${unit.courseId}?unit=${unitId}`);
}

export async function saveCourseTopic(formData: FormData) {
  const user = await editor();
  if (!user) return;
  const topicId = String(formData.get("topicId") || "");
  if (!topicId) return;
  const topic = await prisma.courseTopic.findUnique({
    where: { id: topicId },
    select: { id: true, unitId: true, unit: { select: { courseId: true, course: { select: { ownerId: true } } } } },
  });
  if (!topic || (!isAdmin(user) && topic.unit.course.ownerId !== user.id)) return;
  const quizBody = String(formData.get("quiz") || "").trim().slice(0, 20000);
  await prisma.courseTopic.update({
    where: { id: topicId },
    data: { quizBody, checked: formData.get("checked") === "on" && quizBody.length > 0 },
  });
  refresh(topic.unit.courseId);
  redirect(`/workspace/five/${topic.unit.courseId}?unit=${topic.unitId}`);
}

export async function saveCourseTest(formData: FormData) {
  const user = await editor();
  if (!user) return;
  const unitId = String(formData.get("unitId") || "");
  if (!unitId) return;
  const unit = await prisma.courseUnit.findUnique({
    where: { id: unitId },
    select: { courseId: true, course: { select: { ownerId: true } } },
  });
  if (!unit || (!isAdmin(user) && unit.course.ownerId !== user.id)) return;
  const testBody = String(formData.get("test") || "").trim().slice(0, 20000);
  await prisma.courseUnit.update({
    where: { id: unitId },
    data: { testBody, testChecked: formData.get("checked") === "on" && testBody.length > 0 },
  });
  refresh(unit.courseId);
  redirect(`/workspace/five/${unit.courseId}?unit=${unitId}`);
}

export async function saveCoursePrompt(formData: FormData) {
  const user = await editor();
  if (!user) return;
  const promptId = String(formData.get("promptId") || "");
  if (!promptId) return;
  const prompt = await prisma.coursePrompt.findUnique({
    where: { id: promptId },
    select: { unitId: true, unit: { select: { courseId: true, course: { select: { ownerId: true } } } } },
  });
  if (!prompt || (!isAdmin(user) && prompt.unit.course.ownerId !== user.id)) return;
  const body = String(formData.get("body") || "").trim().slice(0, 20000);
  await prisma.coursePrompt.update({
    where: { id: promptId },
    data: { body, checked: formData.get("checked") === "on" && body.length > 0 },
  });
  refresh(prompt.unit.courseId);
  redirect(`/workspace/five/${prompt.unit.courseId}?unit=${prompt.unitId}`);
}

export async function saveCourseVideo(formData: FormData) {
  const user = await editor();
  if (!user) return;
  const unitId = String(formData.get("unitId") || "");
  if (!unitId) return;
  const unit = await prisma.courseUnit.findUnique({
    where: { id: unitId },
    select: { courseId: true, course: { select: { ownerId: true } } },
  });
  if (!unit || (!isAdmin(user) && unit.course.ownerId !== user.id)) return;
  const raw = String(formData.get("videoUrl") || "").trim();
  const videoUrl = raw ? httpsUrl(raw) : "";
  if (raw && !videoUrl) return;
  await prisma.courseUnit.update({
    where: { id: unitId },
    data: { videoUrl: videoUrl ?? "" },
  });
  refresh(unit.courseId);
  redirect(`/workspace/five/${unit.courseId}?unit=${unitId}`);
}

export async function deleteCourseTopic(formData: FormData) {
  const user = await editor();
  if (!user) return;
  const topicId = String(formData.get("topicId") || "");
  const topic = await prisma.courseTopic.findUnique({
    where: { id: topicId },
    select: { unitId: true, unit: { select: { courseId: true, course: { select: { ownerId: true } } } } },
  });
  if (!topic || (!isAdmin(user) && topic.unit.course.ownerId !== user.id)) return;
  await prisma.courseTopic.delete({ where: { id: topicId } });
  refresh(topic.unit.courseId);
  redirect(`/workspace/five/${topic.unit.courseId}?unit=${topic.unitId}`);
}

export async function deleteCourseUnit(formData: FormData) {
  const user = await editor();
  if (!user) return;
  const unitId = String(formData.get("unitId") || "");
  const unit = await prisma.courseUnit.findUnique({
    where: { id: unitId },
    select: { courseId: true, course: { select: { ownerId: true } } },
  });
  if (!unit || (!isAdmin(user) && unit.course.ownerId !== user.id)) return;
  await prisma.courseUnit.delete({ where: { id: unitId } });
  refresh(unit.courseId);
  redirect(`/workspace/five/${unit.courseId}`);
}
