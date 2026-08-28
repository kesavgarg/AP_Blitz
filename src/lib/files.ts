import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const DOC_TYPES = new Set(["application/pdf"]);

export function allowedMime(mime: string) {
  return IMAGE_TYPES.has(mime) || VIDEO_TYPES.has(mime) || DOC_TYPES.has(mime);
}

export function maxBytesFor(mime: string) {
  if (VIDEO_TYPES.has(mime)) return 200 * 1024 * 1024;
  return 20 * 1024 * 1024;
}

export function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

export async function saveUpload(file: File, uploadedById: string, extra?: {
  contentItemId?: string;
  designRequestId?: string;
}) {
  if (!allowedMime(file.type)) {
    throw new Error("That file type is not allowed.");
  }
  if (file.size > maxBytesFor(file.type)) {
    throw new Error("That file is too large.");
  }
  const ext = path.extname(file.name) || "";
  const storedName = `${crypto.randomUUID()}${ext}`;
  const dir = uploadRoot();
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, storedName);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buf);
  return prisma.fileAsset.create({
    data: {
      filename: file.name,
      storedName,
      mimeType: file.type,
      size: file.size,
      path: dest,
      uploadedById,
      contentItemId: extra?.contentItemId,
      designRequestId: extra?.designRequestId,
    },
  });
}
