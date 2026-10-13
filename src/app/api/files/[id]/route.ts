import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isFounder, onTeam } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role === "BLITZER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const file = await prisma.fileAsset.findUnique({
    where: { id },
    include: {
      contentItem: { include: { team: true } },
      designRequest: true,
    },
  });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    isFounder(user) ||
    file.uploadedById === user.id ||
    user.role === "TEAM_ADMIN" ||
    (file.contentItem?.team && onTeam(user, file.contentItem.team.key));
  const avatarOwner = allowed
    ? null
    : await prisma.user.findFirst({ where: { imageUrl: `/api/files/${id}` }, select: { id: true } });
  if (!allowed && !avatarOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const headers = {
    "Content-Type": file.mimeType,
    "Content-Disposition": `inline; filename="${file.filename.replace(/"/g, "")}"`,
    "Cache-Control": "private, max-age=86400",
  };

  if (file.bytes && file.bytes.length > 0) {
    return new NextResponse(new Uint8Array(file.bytes), { headers });
  }

  try {
    await stat(file.path);
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
  const stream = createReadStream(file.path);
  const web = Readable.toWeb(stream) as ReadableStream;
  return new NextResponse(web, { headers });
}
