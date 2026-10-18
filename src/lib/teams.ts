import { prisma } from "@/lib/prisma";

export async function ensureFiveForFive() {
  const team = await prisma.team.upsert({
    where: { key: "FIVE_FOR_FIVE" },
    update: {
      name: "5 For 5",
      description: "Course docs, unit quizzes, tests, written questions, and 5-minute landscape videos.",
    },
    create: {
      key: "FIVE_FOR_FIVE",
      name: "5 For 5",
      description: "Course docs, unit quizzes, tests, written questions, and 5-minute landscape videos.",
    },
  });
  await prisma.messageChannel.upsert({
    where: { key: "FIVE_FOR_FIVE" },
    update: { name: "5 For 5", teamId: team.id, isPrivate: true },
    create: {
      key: "FIVE_FOR_FIVE",
      name: "5 For 5",
      isPrivate: true,
      slug: "FIVE_FOR_FIVE",
      kind: "TEAM",
      teamId: team.id,
    },
  });
  return team;
}
