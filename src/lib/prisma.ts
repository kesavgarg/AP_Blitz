import "server-only";
import { PrismaClient } from "@prisma/client";
import { stageFromStatus } from "@/lib/stages";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const pooled = url.hostname.includes("pooler.supabase.com") || url.port === "6543";
    if (pooled) {
      url.searchParams.set("pgbouncer", "true");
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "1");
      }
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function withStage(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return;
  const row = data as { status?: unknown; stage?: unknown };
  if (typeof row.status === "string" && row.stage == null) {
    row.stage = stageFromStatus(row.status);
  }
}

const base =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: databaseUrl(),
  });

export const prisma = base.$extends({
  query: {
    contentItem: {
      async create({ args, query }) {
        withStage(args.data);
        return query(args);
      },
      async update({ args, query }) {
        withStage(args.data);
        return query(args);
      },
    },
  },
});

globalForPrisma.prisma = base;
