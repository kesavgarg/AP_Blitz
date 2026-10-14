import "server-only";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
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

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 32 * 1024 * 1024;
const MAX_DOC = 8 * 1024 * 1024;

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
  if (VIDEO_TYPES.has(mime)) return MAX_VIDEO;
  if (DOC_TYPES.has(mime)) return MAX_DOC;
  return MAX_IMAGE;
}

function magicOk(mime: string, head: Buffer) {
  if (head.length < 12) return false;
  if (mime === "image/png") {
    return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mime === "image/jpeg" || mime === "image/jpg") return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (mime === "image/gif") {
    const sig = head.subarray(0, 6).toString("ascii");
    return sig === "GIF87a" || sig === "GIF89a";
  }
  if (mime === "image/webp") return head.subarray(0, 4).toString("ascii") === "RIFF" && head.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "application/pdf") return head.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mime === "video/webm") return head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
  if (mime === "video/mp4" || mime === "video/quicktime" || mime === "image/heic" || mime === "image/heif") {
    return head.subarray(4, 8).toString("ascii") === "ftyp";
  }
  return false;
}

export function uploadRoot() {
  if (process.env.VERCEL) return path.join("/tmp", "uploads");
  return path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

async function storeBlob(storedName: string, file: File, mime: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;
  const { put } = await import("@vercel/blob");
  const blob = await put(`uploads/${storedName}`, file.stream(), {
    access: "private",
    token,
    contentType: mime,
    addRandomSuffix: false,
  });
  return blob.url;
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
  const head = Buffer.from(await file.slice(0, 32).arrayBuffer());
  if (!magicOk(mime, head)) {
    throw new Error("That file doesn't match its type.");
  }
  const ext = path.extname(file.name).toLowerCase();
  const safeExt = EXT_MIME[ext] ? ext : "";
  const storedName = `${crypto.randomUUID()}${safeExt}`;

  const blobUrl = await storeBlob(storedName, file, mime);
  let dest = blobUrl ?? "";
  if (!blobUrl) {
    if (process.env.VERCEL) {
      throw new Error("Uploads need object storage. Set BLOB_READ_WRITE_TOKEN.");
    }
    const dir = uploadRoot();
    dest = path.join(dir, storedName);
    await mkdir(dir, { recursive: true });
    await pipeline(Readable.fromWeb(file.stream() as never), createWriteStream(dest));
  }

  return prisma.fileAsset.create({
    data: {
      filename: file.name.replace(/[\r\n"]/g, "").slice(0, 180) || "file",
      storedName,
      mimeType: mime,
      size: file.size,
      path: dest,
      uploadedById,
      contentItemId: extra?.contentItemId,
      designRequestId: extra?.designRequestId,
    },
  });
}
