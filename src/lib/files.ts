import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const DOC_TYPES = new Set(["application/pdf"]);

const EXT_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

export function mimeOf(file: File) {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  return EXT_MIME[path.extname(file.name).toLowerCase()] ?? "";
}

export function allowedMime(mime: string) {
  return IMAGE_TYPES.has(mime) || VIDEO_TYPES.has(mime) || DOC_TYPES.has(mime);
}

export function maxBytesFor(mime: string) {
  if (VIDEO_TYPES.has(mime)) return 200 * 1024 * 1024;
  return 20 * 1024 * 1024;
}

export function uploadRoot() {
  if (process.env.VERCEL) return path.join("/tmp", "uploads");
  return path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

export async function saveUpload(file: File, uploadedById: string, extra?: {
  contentItemId?: string;
  designRequestId?: string;
}) {
  const mime = mimeOf(file);
  if (!allowedMime(mime)) {
    throw new Error("Use a JPG, PNG, WEBP, GIF, MP4, or PDF.");
  }
  if (file.size > maxBytesFor(mime)) {
    throw new Error("That file is too large.");
  }
  const ext = path.extname(file.name) || (mime.startsWith("image/") ? ".jpg" : "");
  const storedName = `${crypto.randomUUID()}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = uploadRoot();
  const dest = path.join(dir, storedName);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(dest, buf);
  } catch {
    // Vercel / read-only disks: keep going and serve from the database.
  }
  const keepBytes = IMAGE_TYPES.has(mime) || buf.length <= 8 * 1024 * 1024;
  return prisma.fileAsset.create({
    data: {
      filename: file.name,
      storedName,
      mimeType: mime || "application/octet-stream",
      size: file.size,
      path: dest,
      uploadedById,
      contentItemId: extra?.contentItemId,
      designRequestId: extra?.designRequestId,
      bytes: keepBytes ? buf : undefined,
    },
  });
}
