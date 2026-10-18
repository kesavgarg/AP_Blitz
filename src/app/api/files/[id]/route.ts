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
  const guide = allowed || avatarOwner
    ? null
    : await prisma.orgSettings.findFirst({
        where: { id: "org", OR: [{ howToRecordFileId: id }, { promoGuideFileId: id }] },
        select: { id: true },
      });
  if (!allowed && !avatarOwner && !guide) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filename = file.filename.replace(/[\r\n"]/g, "").slice(0, 180) || "file";
  const inline = file.mimeType.startsWith("image/") || file.mimeType.startsWith("video/");
  const headers = {
    "Content-Type": file.mimeType,
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=86400",
  };

  if (file.path.startsWith("https://")) {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) return NextResponse.json({ error: "Missing file" }, { status: 404 });
    const upstream = await fetch(file.path, { headers: { Authorization: `Bearer ${token}` } });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "Missing file" }, { status: 404 });
    return new NextResponse(upstream.body, { headers });
  }

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
