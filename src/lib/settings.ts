import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getOrgSettings = cache(async () => {
  const existing = await prisma.orgSettings.findUnique({ where: { id: "org" } });
  if (existing) return existing;
  try {
    return await prisma.orgSettings.create({ data: { id: "org" } });
  } catch {
    return prisma.orgSettings.findUniqueOrThrow({ where: { id: "org" } });
  }
});
