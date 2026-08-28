import "server-only";
import { prisma } from "@/lib/prisma";

export async function getOrgSettings() {
  const existing = await prisma.orgSettings.findUnique({ where: { id: "org" } });
  if (existing) return existing;
  return prisma.orgSettings.create({ data: { id: "org" } });
}
