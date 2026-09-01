import "server-only";
import { prisma } from "@/lib/prisma";

export async function getOrgSettings() {
  return prisma.orgSettings.upsert({
    where: { id: "org" },
    update: {},
    create: { id: "org" },
  });
}
