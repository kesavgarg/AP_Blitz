import { NextResponse } from "next/server";
import { getRealSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getRealSessionUser();
  if (!user) return NextResponse.json({ unread: 0, notes: 0, messages: 0 });
  const notes = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return NextResponse.json({ unread: notes, notes, messages: 0 });
}
