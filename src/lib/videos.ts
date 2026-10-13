import { youtubeIdFromUrl } from "@/lib/utils";

export type VideoPlatform = "youtube" | "instagram" | "other";

export function detectPlatform(url: string): VideoPlatform {
  if (youtubeIdFromUrl(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  return "other";
}

export function videoUrlKey(url: string) {
  const yt = youtubeIdFromUrl(url);
  if (yt) return `youtube:${yt}`;
  const ig = url.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (ig) return `instagram:${ig[1]}`;
  return `url:${url.trim().toLowerCase().replace(/\/+$/, "")}`;
}

export function youtubeThumb(url: string) {
  const id = youtubeIdFromUrl(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function parseTimestamp(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    return n >= 0 && n <= 60 * 60 * 12 ? n : null;
  }
  const parts = raw.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (parts.length === 2) {
    const [mm, ss] = nums;
    if (ss > 59) return null;
    return mm * 60 + ss;
  }
  const [hh, mm, ss] = nums;
  if (mm > 59 || ss > 59) return null;
  return hh * 3600 + mm * 60 + ss;
}

export function formatTimestamp(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hh > 0) return `${hh}:${pad(mm)}:${pad(ss)}`;
  return `${mm}:${pad(ss)}`;
}

export function parseDuration(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return parseTimestamp(trimmed);
}

export function cleanInstagramUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "instagram.com") return null;
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
