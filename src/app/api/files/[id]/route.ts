import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isFounder, onTeam } from "@/lib/auth";

function byteRange(size: number, header: string | null) {
  if (!header?.startsWith("bytes=")) return null;
  const spec = header.slice("bytes=".length).split(",")[0]?.trim() ?? "";
  const [startRaw, endRaw] = spec.split("-");
  if (!startRaw && endRaw) {
    const last = Number(endRaw);
    if (!Number.isFinite(last) || last <= 0) return "invalid" as const;
    return { start: Math.max(0, size - last), end: Math.max(0, size - 1) };
  }
  const start = Number(startRaw);
  if (!Number.isFinite(start) || start < 0 || start >= size) return "invalid" as const;
  const end = endRaw ? Number(endRaw) : size - 1;
  if (!Number.isFinite(end) || end < start) return "invalid" as const;
  return { start, end: Math.min(end, size - 1) };
}

function fileHeaders(mimeType: string, filename: string, size: number, part: { start: number; end: number } | null) {
  const headers = new Headers();
  headers.set("Content-Type", mimeType);
  headers.set("Content-Disposition", `${mimeType.startsWith("image/") || mimeType.startsWith("video/") ? "inline" : "attachment"}; filename="${filename}"`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("Accept-Ranges", "bytes");
  if (part) {
    headers.set("Content-Range", `bytes ${part.start}-${part.end}/${size}`);
    headers.set("Content-Length", String(part.end - part.start + 1));
  } else {
    headers.set("Content-Length", String(size));
  }
  return headers;
}

export async function GET(
  req: NextRequest,
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
  const range = req.headers.get("range");

  if (file.path.startsWith("https://")) {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) return NextResponse.json({ error: "Missing file" }, { status: 404 });
    const upstreamHeaders = new Headers({ Authorization: `Bearer ${token}` });
    if (range) upstreamHeaders.set("Range", range);
    const upstream = await fetch(file.path, { headers: upstreamHeaders });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "Missing file" }, { status: 404 });
    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || file.mimeType);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
    const length = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    if (length) headers.set("Content-Length", length);
    if (contentRange) headers.set("Content-Range", contentRange);
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  }

  if (file.bytes && file.bytes.length > 0) {
    const bytes = Buffer.from(file.bytes);
    const part = byteRange(bytes.length, range);
    if (part === "invalid") {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.length}` } });
    }
    const body = part ? bytes.subarray(part.start, part.end + 1) : bytes;
    return new NextResponse(new Uint8Array(body), {
      status: part ? 206 : 200,
      headers: fileHeaders(file.mimeType, filename, bytes.length, part),
    });
  }

  let size = 0;
  try {
    size = (await stat(file.path)).size;
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
  const part = byteRange(size, range);
  if (part === "invalid") {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  const stream = createReadStream(file.path, part ? { start: part.start, end: part.end } : undefined);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    status: part ? 206 : 200,
    headers: fileHeaders(file.mimeType, filename, size, part),
  });
}
